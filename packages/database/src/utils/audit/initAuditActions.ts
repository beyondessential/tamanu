import type { Model } from 'models/Model';
import type { ExpressRequest } from '../../types/express';

interface InitAuditActionsParams {
  enabled: boolean;
  userId: string;
  portalUserId?: string;
  version: string;
  isMobile?: boolean;
  backEndContext?: Record<string, any>;
}

export interface CreateAccessLogParams {
  recordId: string;
  frontEndContext: Record<string, any>;
  model: typeof Model;
}

export const initAuditActions = (req: ExpressRequest, params: InitAuditActionsParams) => ({
  access: async ({ recordId, frontEndContext = {}, model }: CreateAccessLogParams) => {
    if (!params.enabled) return;
    return req.models.AccessLog.create({
      sessionId: req.sessionId,
      deviceId: req.deviceId ?? 'unknown-device',
      facilityId: req.facilityId ?? null,
      backEndContext: { ...params.backEndContext, endpoint: req.originalUrl },
      userId: params.userId,
      portalUserId: params.portalUserId,
      version: params.version,
      isMobile: params.isMobile,
      recordType: model.name,
      recordId,
      frontEndContext,
      loggedAt: new Date(),
    });
  },
});
