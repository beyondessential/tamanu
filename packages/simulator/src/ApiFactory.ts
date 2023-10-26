import { version } from '../package.json';
import { chance } from './fake.js';
import { TamanuApi } from '@tamanu/api-client';

export type Role = 'admin' | 'practitioner';
export type Host = 'central' | 'facility';

interface User {
  email: string;
  password: string;
  role: Role;
}

const ADMIN: User = {
  email: 'admin@tamanu.io',
  password: 'admin',
  role: 'admin',
};

export class ApiFactory {
  readonly deviceId: string;

  #users: Map<Role, User> = new Map();
  #pendingUsers: Map<Role, Promise<User>> = new Map();
  #tokens: Map<Role, string> = new Map();
  #central: string;
  #facility: string;

  constructor(centralHost: string | URL, facilityHost: string | URL) {
    this.deviceId = chance.guid();
    this.#central = centralHost.toString();
    this.#facility = facilityHost.toString();
  }

  #makeApi(host: Host) {
    const name = host === 'central' ? 'Tamanu LAN Server' : 'Tamanu Desktop';
    return new TamanuApi(name, version, this.deviceId);
  }

  async #login(api: TamanuApi, role: Role, host: Host): Promise<void> {
    const hostUrl = host === 'central' ? this.#central : this.#facility;

    if (this.#tokens.has(role)) {
      api.setHost(hostUrl);
      api.setToken(this.#tokens.get(role) as string);
      try {
        await api.fetchUserData();
        return;
      } catch (_: unknown) {
        // ignored, we'll go get a new token
      }
    }

    let user = role === 'admin' ? ADMIN : this.#users.get(role);
    if (!user) user = await this.#makeUser(role);

    const { token } = await api.login(hostUrl, user.email, user.password);
    this.#tokens.set(role, token);
  }

  async #makeUser(role: Role): Promise<User> {
    const extantUser = this.#users.get(role);
    if (extantUser) return extantUser;

    const pendingUser = this.#pendingUsers.get(role);
    if (pendingUser) return pendingUser;

    const newPendingUser = (async () => {
      const api = this.#makeApi('central');
      await api.login(this.#central, ADMIN.email, ADMIN.password);

      const email = `simulator-${role}@tamanu.io`;
      const password = 'password'; // chance.string({ length: 12, alpha: true, numeric: true });
      await api.post('admin/user', {
        email,
        password,
        displayName: chance.name(),
        displayId: chance.string({ length: 6, alpha: true, numeric: true }),
        role: 'admin',
      });

      const user = { email, password, role };
      this.#users.set(role, user);
      this.#pendingUsers.delete(role);
      return user;
    })();
    this.#pendingUsers.set(role, newPendingUser);
    return newPendingUser;
  }

  async as(role: Role, host: Host = 'facility'): Promise<TamanuApi> {
    const api = this.#makeApi(host);
    await this.#login(api, role, host);
    return api;
  }
}
