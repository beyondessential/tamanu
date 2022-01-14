import { Sequelize } from 'sequelize';
import { Model } from './Model';

import crypto from 'crypto';
import { promisify } from 'util';
import { getCrypto, Certificate, CertificationRequest, AttributeTypeAndValue } from 'pkijs';
import { fromBER } from 'asn1js';
import Vds from '@pathcheck/vds-sdk';

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
        dateIssued: { // aka signed by CSCA
          type: Sequelize.DATE,
          allowNull: true,
        },

        privateKey: { // encrypted with facility key (icao.keySecret)
          type: Sequelize.BLOB, // PKCS8 DER
          allowNull: false,
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

        serial: { // extracted/cached from certificate
          type: Sequelize.BLOB,
          // technically it's an integer, but we treat it as opaque
          allowNull: true,
        },
        expiry: { // extracted/cached from certificate
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
        validate: {},
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
    });
  }

  static async generateAndBuild({
    keySecret, // secret key from config (icao.keySecret)
    countryCode, // alpha-2 country code
    facility, // Facility instance
  }) {
    const { publicKey, privateKey, request } = await newKeypairAndCsr(
      Buffer.from(keySecret, 'base64'),
      countryCode,
      facility.name,
    );

    const signer = VdsNcSigner.build({
      privateKey,
      publicKey,
      request,
    });
    signer.setFacility(facility);
    return signer;
  }

  // once we've got a certificate back from the CSCA,
  // we extract some data out of it for quick lookups
  setCertificate(certificate) {
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

    // we assume the certificate's NotBefore is the issuance date
    // that might not be exactly true, but it's close enough
    this.dateIssued = cert.notBefore.value;

    this.serial = Buffer.from(cert.serialNumber.valueBlock.valueHex, 'hex');
    this.expiry = cert.notAfter.value;
    this.certificate = txtCert;

    return this;
  }

  isReady() {
    return this.dateIssued !== null &&
      this.serial !== null &&
      this.expiry !== null;
  }

  canIssueSignature() {
    return this.isReady() && this.expiry < new Date;
  }

  async issueSignature(data, { keySecret }) {
    // dev note: this should be checked gracefully prior to here
    if (!this.canIssueSignature()) {
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

    await this.increment('signaturesIssued');
    return signed;
  }
}

// this is a separate function not only because crypto is always
// messy, but also because we want to encourage GC to drop the
// plaintext key after we're done with it.
async function newKeypairAndCsr (keySecret, country, facility) {
  const { publicKey, privateKey } = await promisify(crypto.generateKeyPair)('ec', { namedCurve: 'prime256v1' });

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
    value: facility,
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
