import { expect } from 'chai';
import {
  generateSecretKey,
  encryptSecret,
  decryptSecret,
  isEncryptedSecret,
} from '../../src/utils/crypto';

describe('Crypto utilities', () => {
  describe('generateSecretKey', () => {
    it('should generate a 32-byte key', async () => {
      const key = await generateSecretKey();
      expect(key).to.be.instanceOf(Buffer);
      expect(key.length).to.equal(32); // 256 bits
    });

    it('should generate unique keys each time', async () => {
      const key1 = await generateSecretKey();
      const key2 = await generateSecretKey();
      expect(key1.equals(key2)).to.be.false;
    });
  });

  describe('encryptSecret and decryptSecret', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const key = await generateSecretKey();
      const plaintext = 'my-secret-password';

      const encrypted = await encryptSecret(key, plaintext);
      const decrypted = await decryptSecret(key, encrypted);

      expect(decrypted).to.equal(plaintext);
    });

    it('should encrypt and decrypt an empty string', async () => {
      const key = await generateSecretKey();
      const plaintext = '';

      const encrypted = await encryptSecret(key, plaintext);
      const decrypted = await decryptSecret(key, encrypted);

      expect(decrypted).to.equal(plaintext);
    });

    it('should encrypt and decrypt unicode characters', async () => {
      const key = await generateSecretKey();
      const plaintext = '你好世界 🔐 émojis and spëcial châräctérs';

      const encrypted = await encryptSecret(key, plaintext);
      const decrypted = await decryptSecret(key, encrypted);

      expect(decrypted).to.equal(plaintext);
    });

    it('should encrypt and decrypt a long string', async () => {
      const key = await generateSecretKey();
      const plaintext = 'a'.repeat(10000);

      const encrypted = await encryptSecret(key, plaintext);
      const decrypted = await decryptSecret(key, encrypted);

      expect(decrypted).to.equal(plaintext);
    });

    it('should produce different ciphertexts for the same plaintext', async () => {
      const key = await generateSecretKey();
      const plaintext = 'same-message';

      const encrypted1 = await encryptSecret(key, plaintext);
      const encrypted2 = await encryptSecret(key, plaintext);

      // Different IVs should produce different ciphertexts
      expect(encrypted1).to.not.equal(encrypted2);

      // But both should decrypt to the same plaintext
      expect(await decryptSecret(key, encrypted1)).to.equal(plaintext);
      expect(await decryptSecret(key, encrypted2)).to.equal(plaintext);
    });

    it('should produce output in S1:{iv}:{ciphertext} format', async () => {
      const key = await generateSecretKey();
      const encrypted = await encryptSecret(key, 'test');

      const parts = encrypted.split(':');
      expect(parts.length).to.equal(3);
      expect(parts[0]).to.equal('S1');
      // IV and ciphertext should be base64 encoded
      expect(() => Buffer.from(parts[1], 'base64')).to.not.throw();
      expect(() => Buffer.from(parts[2], 'base64')).to.not.throw();
    });

    it('should fail to decrypt with wrong key', async () => {
      const key1 = await generateSecretKey();
      const key2 = await generateSecretKey();
      const plaintext = 'secret-message';

      const encrypted = await encryptSecret(key1, plaintext);

      try {
        await decryptSecret(key2, encrypted);
        expect.fail('Should have thrown an error');
      } catch (err) {
        // Expected - decryption should fail with wrong key
        expect(err).to.be.instanceOf(Error);
      }
    });

    it('should fail to decrypt invalid format', async () => {
      const key = await generateSecretKey();

      try {
        await decryptSecret(key, 'not-a-valid-format');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect((err as Error).message).to.include('Invalid encrypted secret format');
      }
    });

    it('should fail to decrypt unsupported version', async () => {
      const key = await generateSecretKey();

      try {
        await decryptSecret(key, 'S2:abc:def');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect((err as Error).message).to.include('Unsupported secret version');
      }
    });

    it('should fail to decrypt tampered ciphertext', async () => {
      const key = await generateSecretKey();
      const encrypted = await encryptSecret(key, 'secret');

      const parts = encrypted.split(':');
      // Tamper with the ciphertext
      const tamperedCiphertext = Buffer.from(parts[2], 'base64');
      tamperedCiphertext[0] ^= 0xff;
      parts[2] = tamperedCiphertext.toString('base64');
      const tampered = parts.join(':');

      try {
        await decryptSecret(key, tampered);
        expect.fail('Should have thrown an error');
      } catch (err) {
        // AES-GCM authentication should fail
        expect(err).to.be.instanceOf(Error);
      }
    });
  });

  describe('isEncryptedSecret', () => {
    it('should return true for valid encrypted format', async () => {
      const key = await generateSecretKey();
      const encrypted = await encryptSecret(key, 'test');

      expect(isEncryptedSecret(encrypted)).to.be.true;
    });

    it('should return false for plain strings', () => {
      expect(isEncryptedSecret('just-a-plain-string')).to.be.false;
      expect(isEncryptedSecret('has:colons:but:wrong')).to.be.false;
      expect(isEncryptedSecret('')).to.be.false;
    });

    it('should return false for wrong version prefix', () => {
      expect(isEncryptedSecret('S2:abc:def')).to.be.false;
      expect(isEncryptedSecret('XX:abc:def')).to.be.false;
    });

    it('should return false for non-string values', () => {
      expect(isEncryptedSecret(null as unknown as string)).to.be.false;
      expect(isEncryptedSecret(undefined as unknown as string)).to.be.false;
      expect(isEncryptedSecret(123 as unknown as string)).to.be.false;
      expect(isEncryptedSecret({} as unknown as string)).to.be.false;
    });
  });
});
