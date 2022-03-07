import crypto from 'crypto';
import { canonicalize } from 'json-canonicalize';
import { Sequelize, Op } from 'sequelize';
import { Model } from './Model';

export class VdsNcSigner extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },

        countryCode: {
          type: Sequelize.STRING,
          allowNull: false,
        },

        privateKey: {
          // encrypted with facility key (integrations.vds.keySecret)
          type: Sequelize.BLOB, // PKCS8 DER in PKCS5 DER
          allowNull: true,
        },
        publicKey: {
          type: Sequelize.BLOB, // SPKI DER
          allowNull: false,
        },

        request: {
          // certificate request
          type: Sequelize.TEXT, // PKCS10 PEM
          allowNull: false,
        },
        requestSentAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        certificate: {
          // issued by CSCA
          type: Sequelize.TEXT, // X.509 PEM
          allowNull: true,
        },

        notBefore: {
          // extracted/cached from certificate
          type: Sequelize.DATE,
          allowNull: true,
        },
        notAfter: {
          // extracted/cached from certificate
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
   * Fetches the current active signer, if any.
   * @return {null|Promise<VdsNcSigner>} The active signer, or null if there's none.
   */
  static findActive() {
    return VdsNcSigner.findOne({
      where: {
        notBefore: { [Op.lte]: Sequelize.literal('CURRENT_TIMESTAMP') },
        notAfter: { [Op.gt]: Sequelize.literal('CURRENT_TIMESTAMP') },
        certificate: { [Op.not]: null },
        privateKey: { [Op.not]: null },
      },
    });
  }

  /**
   * @return {boolean} True if the signer is active (can be used).
   */
  isActive() {
    const now = new Date();
    return !!(this.notBefore <= now && this.notAfter > now && this.certificate && this.privateKey);
  }

  /**
   * Issue a signature from some data.
   *
   * @internal
   * @param {object} data Arbitrary data to sign.
   * @param {string} keySecret Encryption key/phrase for the private key (integrations.vds.keySecret).
   * @returns {Promise<{ algorithm: string, signature: Buffer }>} The signature and algorithm.
   */
  async issueSignature(data, keySecret) {
    if (!this.isActive()) {
      throw new Error('Cannot issue signature from this signer');
    }

    const privateKey = crypto.createPrivateKey({
      key: Buffer.from(this.privateKey),
      format: 'der',
      type: 'pkcs8',
      passphrase: Buffer.from(keySecret, 'base64'),
    });

    const canonData = Buffer.from(canonicalize(data), 'utf8');
    const sign = crypto.createSign('SHA256');
    sign.update(canonData);
    sign.end();
    const signature = sign.sign({
      key: privateKey,
      dsaEncoding: 'ieee-p1363',
    });

    await this.increment('signaturesIssued');

    return {
      algorithm: 'ES256',
      signature,
    };
  }
}
