import { LocalDataService } from './localData';

type Permission = { verb: string; noun: string; objectId?: string };

/*
 * Holds the permissions each user received at their most recent online sign-in on this device,
 * keyed by user id, so an offline sign-in gets the signing-in user's own permissions
 */
export class PermissionsService extends LocalDataService {
  static CONFIG_KEY = 'permissionsByUser';

  declare data: Record<string, Permission[]> | null;

  extractDataFromPayload(payload: any): Record<string, Permission[]> {
    return { ...this.data, [payload.user.id]: payload.permissions };
  }

  getForUser(userId: string): Permission[] | undefined {
    return this.data?.[userId];
  }
}
