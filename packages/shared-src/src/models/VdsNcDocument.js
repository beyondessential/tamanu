import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { VdsNcSigner } from './VdsNcSigner';
import { ICAO_DOCUMENT_TYPES, SYNC_DIRECTIONS } from '../constants';

export class VdsNcDocument extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        signedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },

        type: {
          type: Sequelize.ENUM(...Object.values(ICAO_DOCUMENT_TYPES)),
          allowNull: false,
        },
        messageData: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        recipientEmail: {
          type: Sequelize.STRING,
          allowNull: true,
        },

        algorithm: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        signature: {
          type: Sequelize.BLOB,
          allowNull: true,
        },
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
        validate: {
          mustHavePatient() {
            if (!this.patientId) {
              throw new Error('A VDS-NC document must be attached to a patient.');
            }
          },
          mustHaveValidType() {
            if (!Object.keys(ICAO_DOCUMENT_TYPES).includes(this.type)) {
              throw new Error('A VDS-NC document must have a valid type.');
            }
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
    });
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
    });
    this.belongsTo(models.VdsNcSigner, {
      foreignKey: 'signerId',
    });
  }

  /**
   * @returns {boolean} True if this has been signed.
   */
  isSigned() {
    return !!(this.algorithm && this.signature && this.signedAt);
  }

  /**
   * Signs a document.
   *
   * If the document is already signed, this will silently do nothing, and return
   * as normal.
   *
   * @param {string} keySecret Base64-encoded key secret (icao.keySecret).
   * @returns {Promise<VdsNcDocument>} This object, signed, stored to the database.
   */
  async sign(keySecret) {
    if (this.isSigned()) return this;

    const signer = await VdsNcSigner.findActive();

    const data = {
      hdr: {
        t: this.type,
        v: 1,
        is: signer.countryCode,
      },
      msg: JSON.parse(this.messageData),
    };

    const { alg, sig } = signer.issueSignature(data, keySecret);
    return this.set({
      algorithm: alg,
      signature: Buffer.from(sig, 'base64'),
      signedAt: Sequelize.NOW,
    }).setVdsNcSigner(signer).save();
  }

  /**
   * Returns the signed VDS-NC document as a JSON object.
   *
   * This can then be stringified and encoded as a QR code.
   *
   * @returns {Promise<object>} Signed VDS-NC document.
   * @throws if it is not yet signed.
   */
  async intoVDS() {
    if (!this.isSigned()) throw new Error('Cannot return an unsigned VDS-NC document.');
    const signer = await this.getSigner();

    return {
      hdr: {
        t: this.documentType,
        v: 1,
        is: signer.countryCode,
      },
      msg: this.messageData,
      sig: {
        alg: this.algorithm,
        sig: this.signature.toString('base64'),
      },
    };
  }
}
