import { generateId } from 'ai';

export async function generateHashedPassword(
  password: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(digest).toString('hex');
}

export async function generateDummyPassword(): Promise<string> {
  const password = generateId(12);
  const hashedPassword = await generateHashedPassword(password);
  return hashedPassword;
}
