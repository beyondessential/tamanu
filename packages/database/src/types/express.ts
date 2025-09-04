import type { Request } from 'express';
import type { AccessLog, User } from '../models';
import type { ModelProperties, Models } from './model';
import type { ReadSettings } from '@tamanu/settings';
import type { CreateAccessLogParams } from 'utils/audit/initAuditActions';

export interface ExpressRequest extends Request {
  user?: ModelProperties<User>;
  settings?: ReadSettings;
  deviceId?: string;
  sessionId?: string;
  facilityId?: string;
  models: Models;
  audit: {
    access: (params: CreateAccessLogParams) => Promise<AccessLog | void>;
  };
}
