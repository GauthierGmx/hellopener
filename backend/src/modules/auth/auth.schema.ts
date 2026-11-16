import { z } from "zod";

/**
 * Validates an email address using normalization and a test for a valid email format.
 * The string is normalized by trimming whitespace and converting to lowercase before validation.
 * Since z.string().email() is deprecated, I use z.string().pipe(z.email()) to validate the email format.
 */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(255, "Must be at most 255 characters long")
  .pipe(z
    .email("Must be a valid email address")
  );

/**
 * Validates a password
 * Based on NIST guidelines, a long password is preferable to a complex one, so we only check for length and not for complexity.
 */
const passwordSchema = z
  .string()
  .min(16, "Must be at least 16 characters long")
  .max(128, "Must be at most 128 characters long");

/**
 * Validates a username using a regular expression.
 * The username is normalized by converting to lowercase and trimming whitespace before validation.
 * The username must be at least 3 characters long, at most 32 characters long
 * and can only contain lowercase letters, numbers, underscores and hyphens.
 */
const usernameSchema = z
  .string()
  .toLowerCase()
  .trim()
  .min(3, "Must be at least 3 characters long")
  .max(32, "Must be at most 32 characters long")
  .regex(
    /^[a-z0-9_-]+$/,
    "Can only contain lowercase letters, numbers, underscores and hyphens",
  );

/**
 * Validates the request body for the register endpoint.
 * The body must contain an email, a password and a username.
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validates the request body for the login endpoint.
 * The body must contain an email and a password.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Must be at least 1 character long")
    .max(128, "Must be at most 128 characters long"),
});
export type LoginInput = z.infer<typeof loginSchema>;
