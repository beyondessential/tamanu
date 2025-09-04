import type { Model } from 'models/Model';
import type { ExpressRequest } from '../../types/express';

interface InitAuditActionsParams {
  enabled: boolean;
  userId: string;
  version: string;
  isMobile?: boolean;
  backEndContext?: Record<string, any>;
}

export interface CreateAccessLogParams {
  recordId: string;
  frontEndContext?: Record<string, any>;
  model: typeof Model;
}

export const initAuditActions = (req: ExpressRequest, params: InitAuditActionsParams) => ({
  access: async ({ recordId, frontEndContext = {}, model }: CreateAccessLogParams) => {
    if (!params.enabled) return;
    return req.models.AccessLog.create({
      sessionId: req.sessionId,
      deviceId: req.deviceId ?? 'unknown-device',
      facilityId: req.facilityId ?? null,
      backEndContext: { endpoint: req.originalUrl, ...params.backEndContext },
      frontEndContext,
      userId: params.userId,
      version: params.version,
      isMobile: params.isMobile ?? false,
      recordType: model.name,
      recordId,
      loggedAt: new Date(),
    });
  },
});
