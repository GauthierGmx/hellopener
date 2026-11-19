import { getCommonPasswords } from "./load-common-password.js";

/**
 * Normalize a password for comparison by applying Unicode normalization (NFKD), removing all non-alphanumeric characters and accents, and converting to lowercase.
 * This is done to ensure that passwords are compared in a consistent manner, regardless of case or special characters.
 * @param password The password to normalize
 * @returns The normalized password
 */
export function normalizeForComparison(password: string): string {
    return password.toLowerCase().replaceAll('œ', 'oe').replaceAll('æ', 'ae').normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * Counts the number of distinct characters in a password, using a Set to store unique characters.
 * @param password The password to count distinct characters in
 * @returns The number of distinct characters in the password
 */
export function countDistinctChars(password: string): number {
    const distinctChars = new Set<string>(password);
    return distinctChars.size;
}

/**
 * Checks if the password .
 * The password is normalized using {@link normalizeForComparison} before comparison to ensure that the check is case-insensitive and ignores special characters.
 * @param password The password to check
 * @returns True if the password contains a repeated pattern, false otherwise
 */
export function isRepeatedPattern(password: string): boolean {
    const normalized = normalizeForComparison(password);
    const n = normalized.length;

    const maxPeriod = Math.floor(n / 2);

    // Test every possible period length from 1 to maxPeriod
    for (let period = 1; period <= maxPeriod; period++) {
        let matches = true;

        // Check if the substring of length 'period' starting at index 0 is repeated throughout the string
        for (let i = period; i < n; i++) {
            if (normalized[i] !== normalized[i - period]) {
                matches = false;
                break;
            }
        }

        // No differences : string is made of repeated patterns of length 'period'
        if (matches) {
            return true;
        }
    }

    return false;
}

/**
 * Checks if the password exists in the 100k most common password list {@link getCommonPasswords} from NCSC
 * The password is normalized using {@link normalizeForComparison} before comparison to ensure that the check is case-insensitive and ignores special characters.
 * @param password The password to check
 * @returns True if the password is in the list, false otherwise
 */
export function isCommonPassword(password: string): boolean {
    const commonPasswords = getCommonPasswords();
    const normalized = normalizeForComparison(password);
    return commonPasswords.has(normalized);
}

/**
 * Checks if the password contains the username or the local part of the email address (the part before the '@' symbol).
 * The password is normalized using {@link normalizeForComparison} before comparison to ensure that the check is case-insensitive and ignores special characters.
 * The local part of the email is only checked if it is at least 4 characters long, to avoid false positives with short email addresses.
 * The username is only checked if it is at least 4 characters long, to avoid false positives with short usernames.
 * @param password The password to check
 * @param info The user's username and email address
 * @returns True if the password contains the username or the local part of the email address, false otherwise
 */
export function containsUserInfo(password: string,  info: { username: string, email: string }): boolean {
    const localEmailPart = info.email.split("@")[0];

    const normalizedPassword = normalizeForComparison(password);
    const normalizedUsername = normalizeForComparison(info.username);
    const normalizedLocalEmailPart = normalizeForComparison(localEmailPart);
    
    if (normalizedUsername.length >= 4 && normalizedPassword.includes(normalizedUsername)) {
        return true;
    }

    if (normalizedLocalEmailPart.length >= 4 && normalizedPassword.includes(normalizedLocalEmailPart)) {
        return true;
    }

    return false;
}