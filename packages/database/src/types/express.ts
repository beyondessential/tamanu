import type { Request } from 'express';
import type { AccessLog, User } from '../models';
import type { ModelProperties, Models } from './model';
import type { ReadSettings } from '@tamanu/settings';
import type { AccessLogParams } from 'utils/audit/addAuditUtilToRequest';

export interface ExpressRequest extends Request {
  user?: ModelProperties<User>;
  settings?: ReadSettings;
  deviceId?: string;
  models: Models;
  audit?: {
    access: (params: AccessLogParams) => Promise<AccessLog | void>;
  };
}
