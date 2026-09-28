import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type OwnerCredential = {
  token: string;
  tokenHash: string;
};

export function createOwnerCredential(): OwnerCredential {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashOwnerToken(token) };
}

export function hashOwnerToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function ownerTokenMatches(token: string, storedHash: string | null): boolean {
  if (!storedHash || token.length === 0) return false;
  const actual = Buffer.from(hashOwnerToken(token), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
