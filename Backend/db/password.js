import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function isPasswordHashed(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), ROUNDS);
}

/**
 * Verify plain password against stored hash.
 * Legacy plain-text passwords still work once; caller should re-hash on success.
 */
export async function verifyPassword(plain, stored) {
  if (!stored) return false;
  const input = String(plain);
  if (isPasswordHashed(stored)) {
    return bcrypt.compare(input, stored);
  }
  return stored.trim() === input.trim();
}
