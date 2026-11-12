export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000 // 15min
export const REFRESH_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000 // 14 days
export const REFRESH_COOKIE_NAME = 'hellopener-refresh-token'
export const LIMIT_ATTEMPT_BEFORE_LOCK_ACCOUNT = 5
export const DURATION_LOCK_ACCOUNT_MS = 15 * 60 * 1000 // 15min
export const RETENTION_PERIOD_LOGS_MS = 180 * 24 * 60 * 60 * 1000 // 180 days (around 6 months)
export const GRACE_REFRESH_PERIOD_MS = 5 * 1000 // 5sec