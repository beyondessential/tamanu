import { IConfig } from 'config';
declare module 'config' {
  // eslint-disable-next-line no-unused-vars
  interface IConfig {
    serverFacilityId?: string;
    serverFacilityIds?: string[];
  }
}
