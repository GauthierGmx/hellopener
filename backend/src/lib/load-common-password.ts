import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, "data", "100k-most-used-passwords-NCSC.txt");

let commonPasswords: Set<string> | null = null;

export function getCommonPasswords(): Set<string> {
  if (commonPasswords) return commonPasswords;

  const content = readFileSync(filePath, "utf-8");

  commonPasswords = new Set(
    content
      .split(/\r?\n/)
      .map((pwd) => pwd.replace('œ', 'oe').replace('æ', 'ae').normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, '').toLowerCase())
      .filter(Boolean),
  );
  return commonPasswords;
}
