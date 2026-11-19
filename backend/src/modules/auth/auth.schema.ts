import { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_DISTINCT_CHARS, PASSWORD_MIN_LENGTH } from "../../config/constants.js";
import { containsUserInfo, isRepeatedPattern, isCommonPassword, countDistinctChars } from "../../lib/password-policy.js";

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
 * Based on NIST guidelines, a long password is preferable to a complex one, so I don't enforce complexity requirements, but we do enforce a minimum length and a maximum length
 * I also check for repeated patterns, common passwords and distinct characters to avoid weak passwords
 * The password is normalized using Unicode normalization (NFKC) before validation
 */
const passwordSchema = z
  .string()
  .normalize("NFKC")
  .superRefine(
    (password, ctx) => {
      if (password.length < PASSWORD_MIN_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
        });
      }

      if (password.length > PASSWORD_MAX_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters long`,
        });
      }

      if (isRepeatedPattern(password)) {
        ctx.addIssue({
          code: "custom",
          message: "Password cannot contain repeated patterns",
        });
      }

      if (isCommonPassword(password)) {
        ctx.addIssue({
          code: "custom",
          message: "Password is too common",
        });
      }

      if (countDistinctChars(password) < PASSWORD_MIN_DISTINCT_CHARS) {
        ctx.addIssue({
          code: "custom",
          message: `Password must contain at least ${PASSWORD_MIN_DISTINCT_CHARS} distinct characters`,
        });
      }
    }
  );

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
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
  })
  .superRefine(
    (data, ctx) => {
      if (containsUserInfo(data.password, { username: data.username, email: data.email })) {
        ctx.addIssue({
          code: "custom",
          path: ["password"],
          message: "Password cannot contain username or email",
        });
      }
    }
  );
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validates the request body for the login endpoint.
 * The body must contain an email and a password.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .normalize("NFKC")
    .min(1, "Must be at least 1 character long")
    .max(PASSWORD_MAX_LENGTH, `Must be at most ${PASSWORD_MAX_LENGTH} characters long`),
});
export type LoginInput = z.infer<typeof loginSchema>;
