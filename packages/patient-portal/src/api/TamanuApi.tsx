// @ts-ignore - Using JS package without types for now
import { TamanuApi as BaseTamanuApi } from '@tamanu/api-client';
import { getDeviceId } from '@utils/getDeviceId';

export class TamanuApi extends BaseTamanuApi {
  constructor(appVersion: string) {
    const url = new URL(window.location.href);
    url.pathname = '/api/portal';

    super({
      endpoint: url.toString(),
      agentName: 'patient-portal',
      agentVersion: appVersion,
      deviceId: getDeviceId(),
      logger: console,
    });
  }

  // Override login for patient portal authentication flow
  async login(email: string, config = {}) {
    const response = await this.post('login', { email } as any, {
      ...config,
      returnResponse: true,
      useAuthToken: false,
      waitForAuth: false,
    });

    const { token } = await response.json();
    this.setToken(token);

    // Fetch user data from patient portal endpoint
    const userResponse = await this.get('me', {}, { ...config, waitForAuth: false });
    const user = userResponse.data; // Extract the actual patient data

    return { token, user };
  }
}
