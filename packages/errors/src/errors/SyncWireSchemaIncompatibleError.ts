import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

export class SyncWireSchemaIncompatibleError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.SYNC_WIRE_SCHEMA_INCOMPATIBLE, 'Sync wire schema version is incompatible', 400, detail);
  }
}
