import type { Role, User } from "../../generated/prisma/client.js";

// Define a type for the public user data that will be sent to the client
export type PublicUser = {
    id: string;
    username: string;
    email: string;
    role: Role;
    balance: number;
    createdAt: Date;
    lastRechargedAt: Date | null;
}

// Define a type that represents the pair of token for authentication
export type TokenPair = {
    accessToken: string;
    refreshToken: string;   // Raw refresh token, not the hash
}

// Define a type that represents the result of an authentication operation
export type AuthResult = {
    user: PublicUser;
    tokens: TokenPair;
}

/**
 * Converts a User object from the database to a PublicUser object
 * @param user The User coming from the database, with all its fields
 * @returns A PublicUser object with only the necessary fields
 */
export const toPublicUser = (user: User): PublicUser => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    balance: user.balance,
    createdAt: user.createdAt,
    lastRechargedAt: user.lastRechargedAt,
});