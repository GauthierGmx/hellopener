import { Request, Response, NextFunction } from "express";
import { AppError, NotFoundError } from "../lib/errors.js";

// Create a type for the error response structure
export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/**
 * Handles 404 errors.
 * @param req   The request object.
 * @param _res  The response object.
 * @param next  The next middleware function.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction,): void {
  next(new NotFoundError(`The requested resource ${req.originalUrl} was not found.`));
}

/**
 * Checks if the error is a body parser error.
 * @param err The error to check.
 * @returns True if the error is a body parser error, false otherwise.
 */
function isBodyParserError(err: unknown,): err is { status: number; type: string } {
    return (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        typeof err.status === "number" &&
        "type" in err &&
        typeof err.type === "string"
    );
}

/**
 * The error handler middleware.
 * @param err   The error to handle.
 * @param req   The request object.
 * @param res   The response object.
 * @param next  The next middleware function.
 * @returns A response with the appropriate status code, error message and details if it's a 4xx error.
 */
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = 500;
    let code = "INTERNAL_ERROR";
    let message = "An unexpected error occurred.";
    let details: unknown = undefined;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
        details = err.details;
    } else if (isBodyParserError(err) && err.status >= 400 && err.status < 500) {
        statusCode = err.status;
        if (err.type === "entity.parse.failed") {
            statusCode = 400;
            code = "INVALID_JSON";
            message = "Invalid JSON payload";
        } else if (err.type === "entity.too.large") {
            statusCode = 413;
            code = "PAYLOAD_TOO_LARGE";
            message = "Payload too large";
        } else {
            code = "BAD_REQUEST";
            message = "Bad request";
        }
    }

    if (statusCode >= 500) {
        console.error(req.method, req.originalUrl, err);
    }

    const isClientError = statusCode >= 400 && statusCode < 500;
    const body: ErrorResponse = {
        error: {
            code,
            message,
            ...(isClientError && details !== undefined ? { details } : {}),
        },
    };
    res.status(statusCode).json(body);
}
