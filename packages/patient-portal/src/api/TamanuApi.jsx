import { TamanuApi as BaseTamanuApi } from '@tamanu/api-client';
import { getDeviceId } from '@utils/getDeviceId';

export class TamanuApi extends BaseTamanuApi {
  constructor(appVersion) {
    const url = new URL(location);

    super({
      endpoint: url.origin,
      agentName: 'patient-portal',
      agentVersion: appVersion,
      deviceId: getDeviceId(),
    });
  }
}
