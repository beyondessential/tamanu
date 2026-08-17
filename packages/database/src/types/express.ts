import type { Request } from 'express';
import type { Sequelize } from 'sequelize';
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
  db: Sequelize;
  models: Models;
  audit: {
    access: (params: CreateAccessLogParams) => Promise<AccessLog | void>;
  };
  // Installed by the servers that enforce a permission check per endpoint; marks
  // this request's check as satisfied. Optional because not every server does.
  flagPermissionChecked?: () => void;
}
