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
        indexes: [{ unique: true, fields: ['unique_proof_id'] }],
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
   * Signs a document.
   *
   * If the document is already signed, this will silently do nothing, and return
   * as normal.
   *
   * @param {string} keySecret Base64-encoded key secret (icao.keySecret).
   * @returns {Promise<VdsNcDocument>} This object, signed, stored to the database.
   * @throws {Error} if there's no active signer.
   */
  async sign(keySecret) {
    if (this.isSigned()) return this;

    const signer = await VdsNcSigner.findActive();
    if (!signer) throw new Error('No active signer');

    const msg = JSON.parse(this.messageData);
    let uniqueProofId;
    switch (this.type) {
      case 'icao.test':
        uniqueProofId = await this.makeUniqueProofId('TT');
        msg.utvi = uniqueProofId;
        break;
      case 'icao.vacc':
        uniqueProofId = await this.makeUniqueProofId('TV');
        msg.ucvi = uniqueProofId;
        break;
      default:
        throw new Error(`Unknown VDS-NC type: ${this.type}`);
    }

    const data = {
      hdr: {
        t: this.type,
        v: 1,
        is: signer.countryCode,
      },
      msg,
    };

    const { algorithm, signature } = await signer.issueSignature(data, keySecret);
    await this.setVdsNcSigner(signer);
    return this.update({
      uniqueProofId,
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

    return canonicalize({
      hdr: {
        t: this.type,
        v: 1,
        is: signer.countryCode,
      },
      msg,
      sig: {
        alg: this.algorithm,
        sigvl: base64UrlEncode(this.signature),
        cer: base64UrlEncode(depem(signer.certificate, 'CERTIFICATE')),
      },
    });
  }

  /**
   * Generate a new unique proof (of vax, of test) ID with the given prefix.
   *
   * NB: only guarantees uniqueness on Sync server, which is where it should run.
   *
   * @param {string} prefix
   * @returns {string}
   */
  async makeUniqueProofId(prefix) {
    // Generate a bunch of candidates at random and check them for actual
    // uniqueness against the database at once. This saves N-1 queries in
    // the case where the first N generated are non-unique.
    //
    // With a two-char prefix, randomness will be 10 chars, or 5 bytes of
    // hex, which gives use a numberspace of about 2 trillion, and a chance
    // of finding 5 collisions of under 1 in a 100 billionth. Good enough!
    const candidates = Array(5)
      .fill(0)
      .map(() =>
        `${prefix}${crypto
          .randomBytes(12)
          .toString('hex')
          .toUpperCase()}`.slice(0, 12),
      );

    const collisions = await VdsNcDocument.findAll({
      attributes: ['unique_proof_id'], // will perform an index-only query!
      where: { uniqueProofId: candidates },
    });

    const unique = candidates.find(cand => !collisions.some(({ uniqueProofId: col }) => col === cand));
    if (!unique) return this.makeUniqueProofId(prefix);
    return unique;
  }
}
