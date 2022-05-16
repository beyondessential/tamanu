import { LocalDataService } from './localData';

export class PermissionsService extends LocalDataService {
  static CONFIG_KEY = 'permissions';

  extractDataFromPayload(payload: any): [] {
    return payload.permissions;
  }
}
