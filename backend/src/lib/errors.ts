export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: unknown

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

// 400 - Validation
export class ValidationError extends AppError {
    constructor(message="Invalid validation data",details?: unknown) {
        super(400, 'VALIDATION_ERROR', message, details);
    }
}

// 401 Unauthenticated / Authentication
export class UnauthenticatedError extends AppError {
    constructor(message="Unauthenticated", details?: unknown) {
        super(401, 'UNAUTHENTICATED', message, details);
    }
}

export class InvalidCredentialsError extends AppError {
    constructor(message="Invalid credentials", details?: unknown) {
        super(401, 'INVALID_CREDENTIALS', message, details);
    }
}

export class AccessTokenExpiredError extends AppError {
    constructor(message="Authentication token has expired", details?:unknown) {
        super(401, 'TOKEN_EXPIRED', message, details);
    }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
    constructor(message="Forbidden access", details?:unknown) {
        super(403, 'FORBIDDEN', message, details);
    }
}

// 404 - Not found
export class NotFoundError extends AppError {
    constructor(message="Resource not found", details?:unknown) {
        super(404, 'NOT_FOUND', message, details);
    }
}

// 409 - Conflict
export class ConflictError extends AppError {
    constructor(message="Conflict with the actual state of the resource", details?: unknown) {
        super(409, 'CONFLICT', message, details);
    }
}

// 429 - Too many requests
export class TooManyRequestsError extends AppError {
    constructor(message="Too many requests, try again later", details?: unknown) {
        super(429, 'TOO_MANY_REQUESTS', message, details);
    }
}