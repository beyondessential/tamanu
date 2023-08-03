import { TamanuApi as OriginalApi } from '@tamanu/api-client';
import { version } from '../package.json';
import { chance } from './fake.js';

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


export class TamanuApi {
  #deviceId: string;

  #users: Map<Role, User> = new Map();
  #central: string;
  #facility: string;

  constructor (centralHost: string | URL, facilityHost: string | URL) {
    this.#deviceId = chance.guid();
    this.#central = centralHost.toString();
    this.#facility = facilityHost.toString();
  }

  #makeApi(host: Host) {
    const name = host === 'central' ? 'Tamanu LAN Server' : 'Tamanu Desktop';
    return new OriginalApi(name, version, this.#deviceId);
  }

  async #makeUser(role: Role): Promise<User> {
    if (this.#users.has(role)) {
      throw new Error(`User for ${role} role already exists`);
    }

    const api = this.#makeApi('central');
    await api.login(this.#central, ADMIN.email, ADMIN.password);

    const email = `${this.#deviceId}-${role}@tamanu.io`;
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
    return user;
  }

  async as(role: Role, host: Host = 'facility'): Promise<OriginalApi> {
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
