import {
  TamanuApi as BaseTamanuApi,
  readPersistedAuthToken,
  writePersistedAuthToken,
} from '@tamanu/api-client';
import { getDeviceId } from '@utils/getDeviceId';
import { LoginCredentials, LoginResponse } from './types';

/** Where the signed-in session is kept, shared by every portal tab on this device. */
export const PORTAL_TOKEN_KEY = 'patientPortalApiToken';

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

  /** The token this tab is using, to tell whether the saved session has since changed. */
  #sessionToken = '';

  async setToken(token: string, refreshToken?: string | null) {
    this.#useToken(token, refreshToken);
    await writePersistedAuthToken(PORTAL_TOKEN_KEY, token, this.deviceId, 'patient-portal');
  }

  #useToken(token: string, refreshToken?: string | null) {
    super.setToken(token, refreshToken ?? undefined);
    this.#sessionToken = token;
  }

  async #readSavedToken() {
    const { token } = await readPersistedAuthToken(
      PORTAL_TOKEN_KEY,
      this.deviceId,
      'patient-portal',
    );
    return token ?? '';
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

    const user = await this.get('me', {}, { ...config, waitForAuth: false });
    this.user = user;
    return { token, user } as LoginResponse;
  }

  /**
   * Fetches the signed-in patient and keeps `this.user` current, so cross-cutting
   * consumers (browser telemetry) can read who is signed in. The base class does
   * this in `fetchUserData`, which the portal's token login flow bypasses — and
   * session restore only sets a token, so without this `user` stays null.
   */
  async fetchCurrentUser() {
    const user = await this.get('me');
    this.user = user;
    return user;
  }

  async logout() {
    await this.setToken('');
  }

  /** Signs this tab in with the saved session, if there is one. */
  async restoreSession() {
    this.#useToken(await this.#readSavedToken());
  }

  /**
   * After the server turns this tab's session away, drops it from the device, unless another tab
   * has meanwhile signed in, in which case this tab takes up that session instead. Says whether
   * it did.
   */
  async forgetRejectedSession() {
    const savedToken = await this.#readSavedToken();
    if (savedToken && savedToken !== this.#sessionToken) {
      this.#useToken(savedToken);
      return true;
    }
    await this.setToken('');
    return false;
  }

  /** Takes up whatever session is saved, after another tab signs in or out. */
  async syncSession() {
    this.#useToken(await this.#readSavedToken());
  }
}
