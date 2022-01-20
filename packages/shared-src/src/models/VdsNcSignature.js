import { Sequelize } from 'sequelize';
import { Model } from './Model';
import { VdsNcSigner } from './VdsNcSigner';
import { ICAO_DOCUMENT_TYPES } from '../constants';

export class VdsNcSignature extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        dateRequested: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        dateSigned: {
          type: Sequelize.DATE,
          allowNull: true,
        },

        recipientEmail: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        documentType: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        messageData: {
          type: Sequelize.JSON,
          allowNull: false,
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
              throw new Error('A VDS-NC signature must be attached to a patient.');
            }
          },
          mustHaveValidDocumentType() {
            if (!Object.keys(ICAO_DOCUMENT_TYPES).includes(this.documentType)) {
              throw new Error('A VDS-NC signature must have a valid document type.');
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
    return !!(this.algorithm && this.signature && this.dateSigned);
  }

  /**
   * Signs a signature request.
   *
   * If the request is already signed, this will silently do nothing, and return
   * as normal.
   *
   * @param {string} keySecret Base64-encoded key secret (icao.keySecret).
   * @returns {Promise<VdsNcSignature>} This object, signed, stored to the database.
   */
  async signRequest(keySecret) {
    if (this.isSigned()) return this;

    const signer = await VdsNcSigner.findActive();

    const data = {
      hdr: {
        t: this.documentType,
        v: 1,
        is: signer.countryCode,
      },
      msg: this.messageData,
    };

    const { alg, sig } = signer.issueSignature(data, keySecret);
    this.algorithm = alg;
    this.signature = Buffer.from(sig, 'base64');
    this.dateSigned = Sequelize.NOW;
    this.setVdsNcSigner(signer);

    return await this.save();
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
