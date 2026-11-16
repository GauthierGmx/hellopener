import type { TypeAuthEvent } from "../../generated/prisma/client.js";
import type { ClientInfo } from "../../lib/client-info.js";
import { prisma } from "../../lib/prisma.js";
import { RETENTION_PERIOD_LOGS_MS } from "../../config/constants.js";

/**
 * Create a new auth event in the database.
 * @param type     The type of the auth event defined in the database schema (TypeAuthEvent).
 * @param options  An object containing the userId (string or null) and the client information (ClientInfo).
 */
export async function recordAuthEvent(type: TypeAuthEvent, options: {userId: string | null; client: ClientInfo}): Promise<void> {
    try {
        const { userId, client } = options;
        await prisma.authEvent.create({
            data: {
                userId: userId ? userId : null,
                type: type,
                ip: client.ip,
                userAgent: client.userAgent,
            },
        });
    } catch(err) {
        console.error("Error recording auth event:", err);
    }
}

/**
 * Delete old auth events from the database that are older than the retention period.
 * @returns The number of deleted auth events.
 */
export async function purgeOldAuthEvents(): Promise<number> {
    const cutoffDate = new Date(Date.now() - RETENTION_PERIOD_LOGS_MS);
    const { count } = await prisma.authEvent.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });
    console.log(`Deleted ${count} old auth events.`);
    return count;
}