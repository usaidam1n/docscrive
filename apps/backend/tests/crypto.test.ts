import { encryptToken, decryptToken } from '../src/lib/crypto.js';

// Mock the config module because crypto.ts relies on appConfig.security.apiSecret
// which parses the environment variable. By mocking it, we don't depend on .env
jest.mock('../src/config/index.js', () => ({
  appConfig: {
    security: {
      apiSecret:
        'test-secret-that-is-at-least-32-chars-long-for-testing-purposes',
    },
  },
}));

describe('Token Encryption', () => {
  it('should encrypt and decrypt a plaintext token successfully', () => {
    const plaintext = 'gho_xxxxxxxxxx_test_token_1234567890abcd';
    const encrypted = encryptToken(plaintext);

    // Should look like hex:hex:hex
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);
    expect(parts[0].length).toBe(32); // 16 bytes IV -> 32 hex chars
    expect(parts[1].length).toBe(32); // 16 bytes AuthTag -> 32 hex chars

    // Should not contain the plaintext anywhere
    expect(encrypted.includes(plaintext)).toBe(false);

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for the same plaintext (random IV)', () => {
    const plaintext = 'my-secret-token';
    const encrypted1 = encryptToken(plaintext);
    const encrypted2 = encryptToken(plaintext);

    expect(encrypted1).not.toBe(encrypted2);

    expect(decryptToken(encrypted1)).toBe(plaintext);
    expect(decryptToken(encrypted2)).toBe(plaintext);
  });

  it('should throw on invalid formats', () => {
    expect(() => decryptToken('invalid-format-string')).toThrow(
      'Invalid encrypted token format'
    );
  });

  it('should throw on tampered ciphertext (auth tag verification)', () => {
    const encrypted = encryptToken('test-data');
    const parts = encrypted.split(':');

    // Tamper with the ciphertext (parts[2])
    const tamperedCiphertext = '00' + parts[2].substring(2);
    const tampered = `${parts[0]}:${parts[1]}:${tamperedCiphertext}`;

    // decipher.final() will throw when auth tag check fails
    expect(() => decryptToken(tampered)).toThrow();
  });
});
