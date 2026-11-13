import type { RequestHandler } from "express";
import type { ZodError, ZodType } from "zod";
import { ValidationError } from "../lib/errors.js";

export type ValidationSource = "body" | "params";

export type ValidationIssue = {
  source: ValidationSource;
  path: string;
  message: string;
};

export type ValidationSchemas = {
  body?: ZodType;
  params?: ZodType;
};

/**
 * Formats Zod validation errors into a more readable format.
 * @param error   The Zod error to format.
 * @param source  The source of the error.
 * @returns An array of formatted validation issues.
 */
export function formatZodIssues(error: ZodError, source: ValidationSource,): ValidationIssue[] {
  return error.issues.map((issue) => ({
    source,
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
}

/**
 * Validates the request based on the provided schemas.
 * @param schemas The validation schemas.
 * @returns The validation middleware.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    const issues: ValidationIssue[] = [];

    // Validate body if schema is provided
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) {
        req.body = result.data; // Cleaning of the body : unknown fields are removed
      } else {
        issues.push(...formatZodIssues(result.error, "body")); // Add body validation issues
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        issues.push(...formatZodIssues(result.error, "params"));
      }
    }

    if (issues.length > 0) {
      return next(new ValidationError("Invalid request data", issues));
    }
    next();
  };
}
