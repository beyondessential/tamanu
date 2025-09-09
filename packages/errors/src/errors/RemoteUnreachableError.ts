import { ERROR_TYPE } from '../types';
import { BaseRemoteError } from './RemoteError';

export class RemoteUnreachableError extends BaseRemoteError {
  constructor(detail?: string) {
    super(ERROR_TYPE.REMOTE_UNREACHABLE, 'Remote unreachable', detail);
    if (detail?.includes('timeout')) {
      this.status = 504;
    }
  }
}
