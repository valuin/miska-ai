import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const key = Buffer.from(process.env.INTEGRATION_SECRET_KEY || "", "utf8");

if (key.length !== 32) {
  throw new Error("INTEGRATION_SECRET_KEY must be exactly 32 bytes long.");
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decrypt(encryptedStr: string): string {
  const [ivB64, authTagB64, encryptedB64] = encryptedStr.split(":");

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

console.log(
  decrypt(
    "SGvxzdgZdZ9kz4g6:/fWG9LmRcS431ZLyj/Tb7A==:wWeSGwKw6q9L5VkY8/M5rO66N8sk",
  ),
);
