import { Sequelize, Op } from 'sequelize';
import { Model } from './Model';

import crypto from 'crypto';
import { promisify } from 'util';
import { getCrypto, Certificate, CertificationRequest, AttributeTypeAndValue } from 'pkijs';
import { fromBER } from 'asn1js';
import Vds from '@pathcheck/vds-sdk';
import assert from 'assert';

const OID_COMMON_NAME = '2.5.4.3';
const OID_COUNTRY_NAME = '2.5.4.6';

export class VdsNcSigner extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        dateCreated: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        dateDeleted: {
          type: Sequelize.DATE,
          allowNull: true,
        },

        countryCode: {
          type: Sequelize.STRING,
          allowNull: false,
        },

        privateKey: { // encrypted with facility key (icao.keySecret)
          type: Sequelize.BLOB, // PKCS8 DER
          allowNull: true,
        },
        publicKey: {
          type: Sequelize.BLOB, // SPKI DER
          allowNull: false,
        },

        request: { // certificate request
          type: Sequelize.TEXT, // PKCS10 PEM
          allowNull: false,
        },
        certificate: { // issued by CSCA
          type: Sequelize.TEXT, // X.509 PEM
          allowNull: true,
        },

        notBefore: { // extracted/cached from certificate
          type: Sequelize.DATE,
          allowNull: true,
        },
        notAfter: { // extracted/cached from certificate
          type: Sequelize.DATE,
          allowNull: true,
        },

        signaturesIssued: {
          // bumped on each signature issuance
          // this is a quick-lookup/cache/redundancy: we could query
          // the database for the amount of signatures linked to this
          // signer instead; this way is more efficient / resistant to
          // e.g. deletions
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        ...options,
        paranoid: true,
        indexes: [{ fields: ['not_before'] }, { fields: ['not_after'] }],
      },
    );
  }

  /**
   * Create a new Signer, which generates a new keypair and certificate request.
   *
   * @param {string} keySecret Encryption key/phrase for the private key (icao.keySecret).
   * @param {string} countryCode The 3-letter ICAO country code. Used as (C) in certificate subject.
   * @param {string} commonName The name (CN) of the signer certificate (icao.csr.commonName).
   * @returns {Promise<VdsNcSigner>} The new Signer, stored in the database.
   */
  static async createKeypair({
    keySecret,   // secret key from config (icao.keySecret)
    countryCode, // ICAO country code (icao.csr.countryCode)
    commonName,  // name on the certificate (icao.csr.commonName)
  }) {
    const { publicKey, privateKey, request } = await newKeypairAndCsr(
      Buffer.from(keySecret, 'base64'),
      countryCode,
      commonName,
    );

    return VdsNcSigner.create({
      countryCode,
      privateKey,
      publicKey,
      request,
    });
  }

  /**
   * Load the signed certificate from the CSCA.
   *
   * @param {string} certificate The signed certificate from the CSCA.
   * @returns {Promise<VdsNcSigner>} The updated Signer.
   */
  loadSignedCertificate(certificate) {
    let binCert, txtCert;
    if (typeof certificate === 'string') {
      if (!certificate.trimStart().startsWith('-----BEGIN CERTIFICATE-----')) {
        throw new Error('Certificate must be in PEM format');
      }

      binCert = Buffer.from(certificate.replace(/^--.+$/mg).trim(), 'base64');
      txtCert = certificate;
    } else if (Buffer.isBuffer(certificate)) {
      binCert = certificate;
      txtCert = `-----BEGIN CERTIFICATE-----\n${certificate.toString('base64')}\n-----END CERTIFICATE-----`;
    } else {
      throw new Error('Certificate must be a string (PEM) or Buffer (DER).');
    }

    const cert = new Certificate({ schema: fromBER(binCert).result });
    this.notBefore = cert.notBefore.value;
    this.notAfter = cert.notAfter.value;
    this.certificate = txtCert;

    return this.save();
  }

  /**
   * Fetches the current active signer, if any.
   * @return {Promise<VdsNcSigner>} The active signer.
   * @throws if there's none.
   */
  static findActiveSigner() {
    return VdsNcSigner.findOne({
      where: {
        notBefore: { [Op.gte]: Sequelize.NOW },
        notAfter: { [Op.lt]: Sequelize.NOW },
        certificate: { [Op.not]: null },
        privateKey: { [Op.not]: null },
      },
    });
  }

  /**
   * @return {boolean} True if the signer is active (can be used).
   */
  isActive() {
    const now = new Date;
    return !!(
      this.notBefore >= now &&
      this.notAfter < now &&
      this.certificate &&
      this.privateKey
    );
  }

  /**
   * Issue a signature from some data.
   *
   * @internal
   * @param {object} data Arbitrary data to sign.
   * @param {string} keySecret Encryption key/phrase for the private key (icao.keySecret).
   * @returns {Promise<{ alg: string, sig: string }>} The signature and algorithm.
   */
  async issueSignature(data, keySecret) {
    if (!this.isActive()) {
      throw new Error('Cannot issue signature from this signer');
    }

    const privateKey = crypto.createPrivateKey({
      key: this.privateKey,
      format: 'der',
      type: 'pkcs8',
      passphrase: Buffer.from(keySecret, 'base64'),
    });

    const publicKey = crypto.createPublicKey({
      key: this.publicKey,
      format: 'der',
      type: 'spki',
    });

    const signed = await Vds.sign(
      { data },
      publicKey.export({ type: 'spki', format: 'pem' }),
      privateKey.export({ type: 'pkcs8', format: 'pem' }),
    );

    assert.deepEqual(signed.data, data);
    await this.increment('signaturesIssued');
    return signed.sig;
  }
}

// this is a separate function not only because crypto is always
// messy, but also because we want to encourage GC to drop the
// plaintext key after we're done with it.
async function newKeypairAndCsr (keySecret, country, name) {
  const { publicKey, privateKey } = await promisify(crypto.generateKeyPair)(
    'ec',
    { namedCurve: 'prime256v1' },
  );

  const cry = getCrypto();
  const publicCryptoKey = cry.importKey('spki', publicKey.export({
    type: 'spki',
    format: 'pem',
  }));
  const privateCryptoKey = cry.importKey('pkcs8', privateKey.export({
    type: 'pkcs8',
    format: 'pem',
  }));

  const csr = new CertificationRequest;
  csr.version = 0;
  csr.subject.typesAndValues.push(new AttributeTypeAndValue({
    type: OID_COUNTRY_NAME,
    value: country,
  }));
  csr.subject.typesAndValues.push(new AttributeTypeAndValue({
    type: OID_COMMON_NAME,
    value: name,
  }));

  await csr.subjectPublicKeyInfo.importKey(publicCryptoKey);
  await csr.sign(privateCryptoKey, 'SHA256');
  const packedCsr = Buffer.from(await csr.toSchema().toBER(false));

  return {
    publicKey: publicKey.export({
      type: 'spki',
      format: 'der',
    }),
    privateKey: privateKey.export({
      type: 'pkcs8',
      format: 'der',
      cipher: 'aes-256-gcm',
      passphrase: keySecret,
    }),
    request: `-----BEGIN CERTIFICATE REQUEST-----\n${packedCsr.toString('base64')}\n-----END CERTIFICATE REQUEST-----`,
  };
}
