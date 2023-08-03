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

  async #makeUser(role: Role): Promise<User> {
    const extantUser = this.#users.get(role);
    if (extantUser) return extantUser;

    const pendingUser = this.#pendingUsers.get(role);
    if (pendingUser) return pendingUser;

    const newPendingUser = (async () => {
      const api = this.#makeApi('central');
      await api.login(this.#central, ADMIN.email, ADMIN.password);

      const email = `${this.deviceId}-${role}@tamanu.io`;
      const password = chance.string({ length: 12, alpha: true, numeric: true });
      await api.post('admin/user', {
        email,
        password,
        displayName: chance.name(),
        displayId: chance.string({ length: 6, alpha: true, numeric: true }),
        role,
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
    const hostUrl = host === 'central' ? this.#central : this.#facility;
    const api = this.#makeApi(host);

    if (role === 'admin') {
      await api.login(hostUrl, ADMIN.email, ADMIN.password);
      return api;
    }

    let user = this.#users.get(role);
    if (!user) {
      user = await this.#makeUser(role);
    }

    await api.login(hostUrl, user.email, user.password);
    return api;
  }
}
