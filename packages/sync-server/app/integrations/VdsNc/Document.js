import { ICAO_DOCUMENT_TYPES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { Signer } from '@tamanu/shared/models';
import { depem, base64UrlEncode } from '@tamanu/shared/utils';
import { canonicalize } from 'json-canonicalize';
import { issueVdsNcSignature } from './Crypto';

export class VdsNcDocument {
  models = { Signer };

  isSigned = false;

  constructor(type, messageData, uniqueProofId) {
    log.debug(`Initialising VDS document type=${type} uvci=${uniqueProofId}`);

    this.type = type;
    this.messageData = messageData;
    this.uniqueProofId = uniqueProofId;

    if (!Object.values(ICAO_DOCUMENT_TYPES).some(typ => this.type === typ.JSON)) {
      throw new Error('A VDS-NC document must have a valid type.');
    }
  }

  /**
   * Returns the "message to sign" part of the document.
   *
   * @internal
   * @returns {Object}
   */
  getMessageToSign() {
    if (!this.signer) throw new Error('Must have a signer.');

    const msg = this.messageData;
    switch (this.type) {
      case 'icao.test':
        msg.utci = this.uniqueProofId;
        break;
      case 'icao.vacc':
        msg.uvci = this.uniqueProofId;
        break;
      default:
        throw new Error('Unreachable');
    }

    return {
      hdr: {
        t: this.type,
        v: 1,
        is: this.signer.countryCode,
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
   * @returns {Promise<Document>} This object, signed.
   * @throws {Error} if there's no active signer.
   */
  async sign() {
    if (this.isSigned) {
      log.debug('Not signing VDS document: already signed');
      return this;
    }

    log.debug('Signing VDS document');

    const signer = await this.models.Signer.findActive();
    if (!signer) throw new Error('No active signer');
    this.signer = signer;

    const data = this.getMessageToSign();
    const { algorithm, signature } = await issueVdsNcSignature(data, { models: this.models });
    this.algorithm = algorithm;
    this.signature = signature;
    this.isSigned = true;

    return this;
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
    if (!this.isSigned) throw new Error('Cannot return an unsigned VDS-NC document.');
    log.debug('Encoding VDS-NC document');

    return canonicalize({
      data: this.getMessageToSign(),
      sig: {
        alg: this.algorithm,
        sigvl: base64UrlEncode(this.signature),
        cer: base64UrlEncode(depem(this.signer.certificate, 'CERTIFICATE')),
      },
    });
  }
}
