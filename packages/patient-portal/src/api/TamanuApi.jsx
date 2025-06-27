import { TamanuApi as BaseTamanuApi } from '@tamanu/api-client';
import { getDeviceId } from '@utils/getDeviceId';

export class TamanuApi extends BaseTamanuApi {
  constructor(appVersion) {
    const url = new URL(location);
    url.pathname = '/api';

    super({
      endpoint: url.toString(),
      agentName: 'patient-portal',
      agentVersion: appVersion,
      deviceId: getDeviceId(),
    });
  }
}
