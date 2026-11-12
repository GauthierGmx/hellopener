import argon2 from 'argon2';
import crypto from 'crypto';

export async function hashPassword(plain: string): Promise<string> {
    try {
        const hash = await argon2.hash(plain, {
            type: argon2.argon2id,  // Explicited default parameter to avoid future breaking changes
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4
        });
        return hash;
    } catch (error) {
        throw new Error(`Failed to hash password`,{cause: error});
    }
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
        const isValid = await argon2.verify(hash, plain);
        return isValid;
    } catch (error) {
        throw new Error(`Failed to verify password`,{cause: error});
    }
}

export const FAKE_HASH = crypto.getRandomValues(new Uint8Array(32));       // Use to prevent timing attack on authentication endpoint when user does not exist