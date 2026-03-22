import { TamanuApi as BaseTamanuApi } from '@tamanu/api-client';
import { getDeviceId } from '@utils/getDeviceId';
import { LoginCredentials, LoginResponse } from './types';

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

  // Using a slightly different login flow for the patient portal authentication flow
  // Don't use the base login() method, use this instead
  async tokenLogin({ loginToken, email }: LoginCredentials, config = {}) {
    const response = await this.post('login', { loginToken, email } as any, {
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

    return { token, user } as LoginResponse;
  }

  async logout() {
    this.setToken('');
    localStorage.removeItem(TOKEN);
  }

  restoreSession() {
    const token = localStorage.getItem(TOKEN);

    if (token) {
      this.setToken(token);
    }
  }
}
