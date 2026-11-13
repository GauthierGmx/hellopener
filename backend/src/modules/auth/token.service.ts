import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ACCESS_TOKEN_TTL_MS } from "../../config/constants.js";
import { env } from "../../config/env.js";
import { Role } from "../../generated/prisma/client.js";
import { AccessTokenExpiredError, UnauthenticatedError } from "../../lib/errors.js";

const JWT_ALGORITHM = "HS256" as const;
const JWT_ISSUER = "hellopener";
const JWT_AUDIENCE = "hellopener-api";

// Define payload Schema for access token
export const accessTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(Role),
});

// Create a TypeScript type from the schema
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

/**
 * Signs an access token with the given payload.
 * @param payload The payload for the access token that contains the role and the subject (user ID).
 * payload.sub is the user ID
 * payload.role is the user's role.
 * @returns The signed access token with iat, exp, iss and aud inside the token, with expiresIn at 15 minutes.
 */
export function signAccessToken({ sub, role }: AccessTokenPayload): string {
  return jwt.sign({ sub, role }, env.JWT_ACCESS_SECRET, {
    algorithm: JWT_ALGORITHM,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: Math.floor(ACCESS_TOKEN_TTL_MS / 1000), // in seconds
  });
}

/**
 * Verifies an access token and returns the decoded payload.
 * @param token The access token to verify.
 * @returns The decoded access token payload reduced to "sub" and "role"
 * @throws {AccessTokenExpiredError} If the token is expired.
 * @throws {UnauthenticatedError} If the token is invalid or its content does not match the expected schema.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  let decoded: string | jwt.JwtPayload;

  // Verify the token and handle errors
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: [JWT_ALGORITHM],  // We accept only HS256, which blocks the "none" algorithm attack
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    });
  } catch (error) {
    // Never propagate the original error to avoid leaking sensitive information
    if (error instanceof jwt.TokenExpiredError) {
      throw new AccessTokenExpiredError();
    }
    throw new UnauthenticatedError();
  }

  // Validate the decoded payload against the schema
  const parsed = accessTokenPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new UnauthenticatedError();
  }
  return parsed.data;
}

/**
 * Hashes a refresh token using SHA-256.
 * SHA-256 is enough because the token is already random with high entropy, so it cannot be guessed or brute-forced from its hash.
 * The hash must be deterministc, so we can find the matching row in the database
 * @param raw The raw refresh token, as received from the client cookie.
 * @returns The hash of the refresh token.
 */
export function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex"); // 64 caractères hexadécimaux
}

/**
 * Generate a new refresh token.
 * The token is a random string, not a JWT. It carries no data.
 * "raw" must be sent to the client, in an httpOnly cookie, never stored or logged on the server.
 * The hash of the token is stored in the database, to be able to find the matching row when the client sends back the token.
 * @returns An object containing the raw refresh token and its hash.
 */
export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");  // Goes to the client, stored in a cookie
  return { raw, hash: hashRefreshToken(raw) };        // Goes into the database
}
