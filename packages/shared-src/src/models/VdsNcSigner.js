import { Sequelize, Op } from 'sequelize';
import crypto from 'crypto';
import Vds from '@pathcheck/vds-sdk';
import assert from 'assert';
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
          // encrypted with facility key (icao.keySecret)
          type: Sequelize.BLOB, // PKCS8 DER
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

  static initRelations(models) {
    this.hasMany(models.VdsNcSigner, {
      foreignKey: 'signerId',
    });
  }

  /**
   * Fetches the current active signer, if any.
   * @return {Promise<VdsNcSigner>} The active signer.
   * @throws if there's none.
   */
  static findActive() {
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
    const now = new Date();
    return !!(this.notBefore >= now && this.notAfter < now && this.certificate && this.privateKey);
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
