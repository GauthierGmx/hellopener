import { randomUUID } from "node:crypto"
import type { Prisma, RefreshToken } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { generateRefreshToken, hashRefreshToken } from "./token.service.js";
import { REFRESH_TOKEN_TTL_MS, GRACE_REFRESH_PERIOD_MS } from "../../config/constants.js";

/**
 * Database client accepted by the functions of this file: the global Prisma client or a transaction client.
 * The global client is compatible with this type, so each function can be called alone (default)
 * or inside `prisma.$transaction(...)` to chain several operations atomically
 */
export type DbClient = Prisma.TransactionClient;

/**
 * Checks if a refresh token record is expired
 * The token is considered expired fromt the exact instants of 'expiresAt'
 * @param record The refresh token record to check.
 * @param now    The current date and time.
 * @returns True if the refresh token is expired, false otherwise.
 */
export function isExpired(record: RefreshToken, now: Date): boolean {
    return record.expiresAt.getTime() <= now.getTime();
}

/**
 * Checks if a refresh token record is revoked.
 * @param record The refresh token record to check.
 * @returns True if the refresh token is revoked, false otherwise.
 */
export function isRevoked(record: RefreshToken): boolean {
    return record.revokedAt !== null;
}

/**
 * Checks if a refresh token was revoked recently (less than GRACE_REFRESH_PERIOD_MS ago).
 * It detects concurrent refresh requests : both send the same token
 * The first one revokes it and rotates it, the second one finds it freshly revoked.
 * Within the grace period, the caller must treat this as a harmless race : reject the second request without revoking the family
 * After the grace period, presenting a revoked token is a reuse (possible theft) and the family must be revoked.
 * @param record The refresh token record to check.
 * @param now    The current date and time.
 * @returns True if the token is revoked and was revoked within the grace period, false otherwise (including when it is not revoked).
 */
export function isWithinGracePeriod(record: RefreshToken, now: Date): boolean {
    if (record.revokedAt === null) {
        return false;
    } else {
        const gracePeriodEnd = new Date(record.revokedAt.getTime() + GRACE_REFRESH_PERIOD_MS);
        return now.getTime() <= gracePeriodEnd.getTime();
    }
}

/**
 * Creates a new refresh token for the given user.
 * @param userId The ID of the user for whom to create a refresh token.
 * @param familyId The family (chain of refresh tokens issued from a single login) the token belongs to
 *                 Omit it on login to start a new family; pass the existing one when rotating a token
 * @param [db=prisma] The database client to use.
 * @returns A promise resolving to the raw token, the familyId and the expiration date (now + {@link REFRESH_TOKEN_TTL_MS})
 */
export async function createRefreshToken(userId: string, familyId?: string, db: DbClient = prisma): Promise<{raw: string; familyId: string; expiresAt: Date}> {
    const familyIdToUse = familyId ?? randomUUID(); // Generate a new familyId if not provided
    const { raw, hash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    // Only the hash of the token is stored in the database for security reasons
    await db.refreshToken.create({
        data: {
            userId,
            familyId: familyIdToUse,
            tokenHash: hash,
            expiresAt,
        },
    });
    
    // The raw token is returned to the caller (to be put in a cookie). This is the only time it exists inclear : it is never stored
    return { raw, familyId: familyIdToUse, expiresAt };
}

/**
 * Finds a refresh token by its raw value.
 * The raw token is hashed before the search, as only the hash is stored in the database for security reasons.
 * If the token is found, it is returned independently of whether it is revoked or expired. The caller should check the token's status using the isRevoked and isExpired functions.
 * @param raw The raw refresh token.
 * @param [db=prisma] The database client to use.
 * @returns A promise resolving to the refresh token if found, or null if not found.
 */
export function findRefreshTokenByRaw(raw: string, db: DbClient = prisma): Promise<RefreshToken | null> {
    const hash = hashRefreshToken(raw);
    return db.refreshToken.findUnique({
        where: { tokenHash: hash },
    });
}

/**
 * Revokes a refresh token only if it is still active, with a single atomic conditional update :
 * The check and the write happend in the same SQL statement
 * If two requests try to consume the same token simultaneously, only one gets 'true', the other gest 'false'
 * updateMany is used instead of update to avoid throwing an error if the token is already revoked
 * @param id The ID of the refresh token to revoke.
 * @param [db=prisma] The database client to use.
 * @returns A promise resolving to true if the refresh token was successfully revoked, false otherwise.
 */
export async function revokeIfActive(id: string, db: DbClient = prisma): Promise<boolean> {
    const { count } = await db.refreshToken.updateMany({
        data: {
            revokedAt: new Date(),
        },
        where: {
            id: id,
            revokedAt: null,
        }
    })

    return count === 1;
}

/**
 * Revokes all the active tokens of a family. Already revoked tokens keep their original 'revokedAt'
 * Used for reuse detection : when a revoked token is presented, the whole chain is cut
 * The rows are kept, so another replayed token of this family is still recognised as a reuse.
 * @param familyId      The ID of the family to revoke.
 * @param [db=prisma]   The database client to use.
 * @returns A promise resolving to the number of revoked refresh tokens.
 */
export async function revokeFamily(familyId: string, db: DbClient = prisma): Promise<number> {
    const { count } = await db.refreshToken.updateMany({
        where: {
            familyId: familyId,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        }
    })
    return count;
}

/**
 * Deletes all refresh tokens belonging to a family, revoked or not. Used on logout.
 * Unlike revokeFamiy, the rows disappear : a replayed token is unknown, which is okay because the session no longer exists.
 * @param familyId      The ID of the family to delete.
 * @param [db=prisma]   The database client to use.
 * @returns A promise resolving to the number of deleted refresh tokens.
 */
export async function deleteFamily(familyId: string, db: DbClient = prisma): Promise<number> {
    const { count } = await db.refreshToken.deleteMany({
        where: {
            familyId: familyId
        }
    })
    return count;
}

/**
 * Deletes the expired refresh tokens.
 * Revoked tokens are not deleted until they expire : they must stay in the database so that their reuse can be detected
 * Once a token is expired, it is rejected anyway, so deleting it is safe
 * Meant to be run by a scheduled job
 * @param [db=prisma]   The database client to use.
 * @returns A promise resolving to the number of deleted refresh tokens.
 */
export async function purgeExpiredRefreshTokens(db: DbClient = prisma): Promise<number> {
    const { count } = await db.refreshToken.deleteMany({
        where: {
            expiresAt: {
                lte: new Date(),
            },
        },
    });
    console.log(`Deleted ${count} old expired refresh token.`);
    return count;
}