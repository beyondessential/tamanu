import { AuthService } from './auth';
import { readConfig, writeConfig } from './config';

/*
 * Service to store data received from AuthService on "remoteSignIn"
 * event locally
 */
export class LocalDataService {
  static CONFIG_KEY: string;

  auth: AuthService;
  data: any;

  constructor(auth: AuthService) {
    this.auth = auth;
    this._readDataFromConfig();
    this.auth.emitter.on('remoteSignIn', payload => {
      this.data = this.extractDataFromPayload(payload);
      // write to config first to make sure it is stringifiable
      this._writeDataToConfig();
      this.onDataLoaded();
    });
  }

  extractDataFromPayload(_payload: any): any {
    throw new Error(
      'Child of LocalDataService needs to implement its own extractDataFromPayload method',
    );
  }

  onDataLoaded(): void {
    // do nothing on the parent class
  }

  async _readDataFromConfig(): Promise<any> {
    const strData = await readConfig((this.constructor as typeof LocalDataService).CONFIG_KEY);
    this.data = JSON.parse(strData);
    this.onDataLoaded();
  }

  async _writeDataToConfig(): Promise<void> {
    const strData = JSON.stringify(this.data);
    await writeConfig((this.constructor as typeof LocalDataService).CONFIG_KEY, strData);
  }
}
