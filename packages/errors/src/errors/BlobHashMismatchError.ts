import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

// spec: XFER
// Received blob content whose bytes do not hash to the offered hash. The
// receiving server discards the content rather than storing it.
export class BlobHashMismatchError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.BLOB_HASH_MISMATCH, 'Blob hash mismatch', 409, detail);
  }
}
