import type { AuthService } from './auth';
import { readConfig, writeConfig } from './config';

/*
 * Service to store data received from AuthService on "remoteSignIn"
 * event locally
 */
export abstract class LocalDataService {
  static CONFIG_KEY: string;

  auth: AuthService;
  data: any;
  /** Settles once the data stored on the device has been read */
  loaded: Promise<void>;

  constructor(auth: AuthService) {
    this.auth = auth;
    this.loaded = this._readDataFromConfig();
    this.auth.emitter.on('remoteSignIn', payload => {
      this.data = this.extractDataFromPayload(payload);
      // write to config first to make sure it is stringifiable
      this._writeDataToConfig();
      this.onDataLoaded();
    });
  }

  abstract extractDataFromPayload(payload: any): any;

  onDataLoaded(): void {
    // do nothing on the parent class
  }

  async _readDataFromConfig(): Promise<void> {
    const strData = await readConfig((this.constructor as typeof LocalDataService).CONFIG_KEY);
    try {
      this.data = JSON.parse(strData);
    } catch (e) {
      // Startup waits on this read, so an unreadable value is treated as nothing stored
      console.warn(e);
      this.data = null;
    }
    this.onDataLoaded();
  }

  async _writeDataToConfig(): Promise<void> {
    const strData = JSON.stringify(this.data);
    await writeConfig((this.constructor as typeof LocalDataService).CONFIG_KEY, strData);
  }
}
