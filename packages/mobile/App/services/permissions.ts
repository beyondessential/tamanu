import { LocalDataService } from './localData';

export class PermissionsService extends LocalDataService {
  static CONFIG_KEY = 'permissions';

  getData(payload: any): [] {
    return payload.permissions;
  }
}
