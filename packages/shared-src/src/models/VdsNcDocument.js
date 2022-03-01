import { Sequelize } from 'sequelize';
import { canonicalize } from 'json-canonicalize';
import crypto from 'crypto';
import { Model } from './Model';
import { VdsNcSigner } from './VdsNcSigner';
import { ICAO_DOCUMENT_TYPES } from '../constants';
import { depem, base64UrlEncode } from '../utils';

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
          type: Sequelize.STRING,
          allowNull: false,
        },
        messageData: {
          type: Sequelize.TEXT,
          allowNull: false,
        },

        uniqueProofId: {
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
        validate: {
          mustHaveValidType() {
            if (!Object.values(ICAO_DOCUMENT_TYPES).some(typ => this.type === typ.JSON)) {
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
    this.belongsTo(models.VdsNcSigner, {
      foreignKey: 'signerId',
    });
  }

  /**
   * @returns {boolean} True if this has been signed.
   */
  isSigned() {
    return !!(this.uniqueProofId && this.algorithm && this.signature && this.signedAt);
  }

  /**
   * Returns the "message to sign" part of the document.
   *
   * @internal
   * @param {string} countryCode Country code of the issuer / signer.
   * @returns {Object}
   */
  getMessageToSign(countryCode) {
    const msg = JSON.parse(this.messageData);
    switch (this.type) {
      case 'icao.test':
        msg.utci = this.uniqueProofId;
        break;
      case 'icao.vacc':
        msg.uvci = this.uniqueProofId;
        break;
      default:
        throw new Error(`Unknown VDS-NC type: ${this.type}`);
    }

    return {
      hdr: {
        t: this.type,
        v: 1,
        is: countryCode,
      },
      msg,
    };
  }

  /**
   * Signs a document.
   *
   * If the document is already signed, this will silently do nothing, and return
   * as normal.
   *
   * @param {string} keySecret Base64-encoded key secret (integrations.vds.keySecret).
   * @returns {Promise<VdsNcDocument>} This object, signed, stored to the database.
   * @throws {Error} if there's no active signer.
   */
  async sign(keySecret) {
    if (this.isSigned()) return this;

    const signer = await VdsNcSigner.findActive();
    if (!signer) throw new Error('No active signer');

    const data = this.getMessageToSign(signer.countryCode);
    const { algorithm, signature } = await signer.issueSignature(data, keySecret);
    await this.setVdsNcSigner(signer);
    return this.update({
      algorithm,
      signature,
      signedAt: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
  }

  /**
   * Returns the signed VDS-NC document as a string.
   *
   * This can then be encoded as a QR code.
   *
   * @returns {Promise<string>} Signed VDS-NC document.
   * @throws {Error} if it is not yet signed.
   */
  async intoVDS() {
    if (!this.isSigned()) throw new Error('Cannot return an unsigned VDS-NC document.');
    const signer = await this.getVdsNcSigner();

    return canonicalize({
      ...this.getMessageToSign(signer.countryCode),
      sig: {
        alg: this.algorithm,
        sigvl: base64UrlEncode(this.signature),
        cer: base64UrlEncode(depem(signer.certificate, 'CERTIFICATE')),
      },
    });
  }
}
