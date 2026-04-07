import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;

/**
 * Derives a 32-byte key from the master secret using scrypt (async).
 * The ENCRYPTION_SECRET env var should be at least 32 chars.
 */
function getKey(salt: Buffer): Promise<Buffer> {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ENCRYPTION_SECRET env var missing or too short (min 32 chars)",
    );
  }
  return new Promise((resolve, reject) => {
    scrypt(secret, salt, 32, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Encrypt a plaintext string.
 * Returns a base64 string: salt:iv:authTag:ciphertext
 */
export async function encrypt(plaintext: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await getKey(salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return [
    salt.toString("hex"),
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted,
  ].join(":");
}

/**
 * Decrypt a string produced by encrypt().
 */
export async function decrypt(encryptedStr: string): Promise<string> {
  const parts = encryptedStr.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted format");
  }

  const [saltHex, ivHex, authTagHex, ciphertext] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = await getKey(salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a value looks like it's already encrypted (salt:iv:tag:data format).
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  return (
    parts.length === 4 &&
    parts[0].length === SALT_LENGTH * 2 &&
    parts[1].length === IV_LENGTH * 2 &&
    parts[2].length === AUTH_TAG_LENGTH * 2
  );
}
