import { TamanuApi as BaseTamanuApi } from '@tamanu/api-client';
import { getDeviceId } from '@utils/getDeviceId';
import { LoginCredentials, LoginResponse } from './types';

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
      defaultRequestConfig: { credentials: 'include' },
    });

    this.restoreSession();
  }

  setToken(_token: string) {
    // Token is in httpOnly cookie; we don't store it in memory or localStorage.
    return super.setToken('');
  }

  // Using a slightly different login flow for the patient portal authentication flow
  // Don't use the base login() method, use this instead
  async tokenLogin({ loginToken, email }: LoginCredentials, config = {}) {
    await this.post('login', { loginToken, email } as any, {
      ...config,
      useAuthToken: false,
      waitForAuth: false,
    });
    // Server sets httpOnly cookie and returns {}; no token in response body

    // Fetch user data (cookie is sent automatically)
    const user = await this.get('me', {}, { ...config, waitForAuth: false });

    return { token: '', user } as LoginResponse;
  }

  async logout() {
    await this.post('logout', undefined, {
      useAuthToken: false,
      waitForAuth: false,
    });
    this.setToken('');
  }

  restoreSession() {
    // Session is restored via httpOnly cookie on first get('me') (e.g. useCurrentUserQuery).
    // Nothing to restore in memory.
  }
}
