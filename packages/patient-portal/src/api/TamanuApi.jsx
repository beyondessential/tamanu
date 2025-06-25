import { TamanuApi as BaseTamanuApi } from '@tamanu/api-client';
import { getDeviceId } from '@utils/getDeviceId';

export class TamanuApi extends BaseTamanuApi {
  constructor(appVersion) {
    const endpoint = import.meta.env.VITE_API_TARGET;

    if (!endpoint) {
      throw new Error('VITE_API_TARGET is not set');
    }

    super({
      endpoint,
      agentName: 'patient-portal',
      agentVersion: appVersion,
      deviceId: getDeviceId(),
    });
  }
}
