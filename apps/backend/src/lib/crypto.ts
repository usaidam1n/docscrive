import crypto from 'crypto';
import { appConfig } from '../config/index.js';

/**
 * AES-256-GCM token encryption/decryption.
 *
 * Key is derived from API_SECRET via HKDF so we don't directly use
 * the HMAC signing key as an encryption key (defense in depth).
 *
 * Format: hex(iv):hex(authTag):hex(ciphertext)
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV
const KEY_LENGTH = 32; // 256-bit key
const AUTH_TAG_LENGTH = 16;

/**
 * Derive a 256-bit encryption key from the API_SECRET using HKDF.
 * Cached after first call — deterministic for the same secret.
 */
let _derivedKey: Buffer | null = null;

function getDerivedKey(): Buffer {
  if (_derivedKey) return _derivedKey;
  _derivedKey = crypto.hkdfSync(
    'sha256',
    appConfig.security.apiSecret,
    'docscrive-token-encryption', // salt
    'github-token-at-rest', // info
    KEY_LENGTH
  ) as unknown as Buffer;
  // hkdfSync returns ArrayBuffer, wrap it
  _derivedKey = Buffer.from(_derivedKey);
  return _derivedKey;
}

/**
 * Encrypt a plaintext GitHub token.
 * @returns Encoded string in format `iv:authTag:ciphertext` (all hex)
 */
export function encryptToken(plaintext: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted GitHub token.
 * @param ciphertext Encoded string in format `iv:authTag:encrypted` (all hex)
 * @returns Original plaintext token
 */
export function decryptToken(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getDerivedKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
