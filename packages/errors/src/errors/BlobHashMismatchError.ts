import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

// spec: XFER
export class BlobHashMismatchError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.BLOB_HASH_MISMATCH, 'Blob hash mismatch', 409, detail);
  }
}
