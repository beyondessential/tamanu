import type { Model } from 'models/Model';
import type { ExpressRequest } from '../../types/express';

interface AddAuditUtilToRequestParams {
  enabled: boolean;
  userId: string;
  portalUserId?: string;
  sessionId: string;
  version: string;
  isMobile?: boolean;
}

export interface AccessLogParams {
  recordId: string;
  frontEndContext: Record<string, any>;
  model: typeof Model;
}

export const addAuditUtilToRequest = async (
  req: ExpressRequest,
  params: AddAuditUtilToRequestParams,
) => {
  req.audit = {
    access: async ({ recordId, frontEndContext = {}, model }: AccessLogParams) => {
      if (!params.enabled) return;
      return req.models.AccessLog.create({
        userId: params.userId,
        portalUserId: params.portalUserId,
        version: params.version,
        isMobile: params.isMobile || false,
        sessionId: params.sessionId,
        recordType: model.name,
        deviceId: req.deviceId || 'unknown-device',
        backEndContext: { endpoint: req.originalUrl },
        recordId,
        frontEndContext,
        loggedAt: new Date(),
        facilityId: null,
      });
    },
  };
};
