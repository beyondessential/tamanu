import crypto from 'crypto';
import { canonicalize } from 'json-canonicalize';
import { Sequelize, Op } from 'sequelize';
import { Model } from './Model';

export class Signer extends Model {
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
        requestSentAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        certificate: {
          // issued by CSCA
          type: Sequelize.TEXT, // X.509 PEM
          allowNull: true,
        },

        workingPeriodStart: {
          // start of the working period of this certificate
          // extracted/cached from certificate PKUP (Private Key Usage Period)
          type: Sequelize.DATE,
          allowNull: true,
        },
        workingPeriodEnd: {
          // end of the working period of this certificate
          // extracted/cached from certificate PKUP (Private Key Usage Period)
          type: Sequelize.DATE,
          allowNull: true,
        },
        validityPeriodStart: {
          // start of the validity period of this certificate
          // extracted/cached from certificate Not Before field
          type: Sequelize.DATE,
          allowNull: true,
        },
        validityPeriodEnd: {
          // end of the validity period of this certificate
          // extracted/cached from certificate Not After field
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
        indexes: [
          { fields: ['validity_period_start'] },
          { fields: ['validity_period_end'] },
          { fields: ['working_period_start'] },
          { fields: ['working_period_end'] },
        ],
      },
    );
  }

  /**
   * Fetches the current active signer, if any.
   * @return {null|Promise<Signer>} The active signer, or null if there's none.
   */
  static findActive() {
    return Signer.findOne({
      where: {
        validityPeriodStart: { [Op.lte]: Sequelize.literal('CURRENT_TIMESTAMP') },
        workingPeriodStart: { [Op.lte]: Sequelize.literal('CURRENT_TIMESTAMP') },
        workingPeriodEnd: { [Op.gt]: Sequelize.literal('CURRENT_TIMESTAMP') },
        validityPeriodEnd: { [Op.gt]: Sequelize.literal('CURRENT_TIMESTAMP') },
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
    return !!(
      this.validityPeriodStart <= now &&
      this.workingPeriodStart <= now &&
      this.workingPeriodEnd > now &&
      this.validityPeriodEnd > now &&
      this.certificate &&
      this.privateKey
    );
  }

  /**
   * Issue a signature from some data.
   *
   * @internal
   * @param {object} data Arbitrary data to sign.
   * @returns {Promise<{ algorithm: string, signature: Buffer }>} The signature and algorithm.
   */
  async issueSignature(data) {
    if (!this.isActive()) {
      throw new Error('Cannot issue signature from this signer');
    }

    const privateKey = crypto.createPrivateKey({
      key: Buffer.from(this.privateKey),
      format: 'der',
      type: 'pkcs8',
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
