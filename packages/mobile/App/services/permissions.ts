import type { AuthService } from './auth';
import { removeConfig } from './config';
import { LocalDataService } from './localData';

type Permission = { verb: string; noun: string; objectId?: string };

/*
 * Holds the permissions each user received at their most recent online sign-in on this device,
 * keyed by user id, so an offline sign-in gets the signing-in user's own permissions
 */
export class PermissionsService extends LocalDataService {
  static CONFIG_KEY = 'permissionsByUser';

  constructor(auth: AuthService) {
    super(auth);
    // A single list for the whole device was once stored under this key, and nothing reads it now
    void removeConfig('permissions');
  }

  extractDataFromPayload(payload: any): Record<string, Permission[]> {
    return { ...this.data, [payload.user.id]: payload.permissions };
  }

  getForUser(userId: string): Permission[] | undefined {
    return this.data?.[userId];
  }
}
