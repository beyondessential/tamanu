// @ts-ignore - Using JS package without types for now
import { TamanuApi as BaseTamanuApi } from '@tamanu/api-client';
import { getDeviceId } from '@utils/getDeviceId';

const TOKEN = 'patientPortalApiToken';

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

    this.restoreSession();
  }

  setToken(token: string) {
    if (token) {
      localStorage.setItem(TOKEN, token);
    }
    return super.setToken(token);
  }

  // Override login for patient portal authentication flow
  async login(loginToken: string, config = {}) {
    const response = await this.post('login', { loginToken } as any, {
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

  restoreSession() {
    const token = localStorage.getItem(TOKEN);

    if (token) {
      this.setToken(token);
    }
  }
}
