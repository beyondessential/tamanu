import {
  TamanuApi as BaseTamanuApi,
  readPersistedAuthToken,
  writePersistedAuthToken,
} from '@tamanu/api-client';
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

  }

  async setToken(token: string, refreshToken?: string | null) {
    super.setToken(token, refreshToken ?? undefined);
    await writePersistedAuthToken(TOKEN, token, this.deviceId, 'patient-portal');
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
    await this.setToken(token);

    // Fetch user data from patient portal endpoint
    const userResponse = await this.get('me', {}, { ...config, waitForAuth: false });
    const user = userResponse.data; // Extract the actual patient data

    return { token, user } as LoginResponse;
  }

  async logout() {
    await this.setToken('');
  }

  async restoreSession() {
    const { token } = await readPersistedAuthToken(TOKEN, this.deviceId, 'patient-portal');
    if (!token) {
      return;
    }
    await this.setToken(token);
  }
}
