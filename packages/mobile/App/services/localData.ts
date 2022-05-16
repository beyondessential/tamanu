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
    this.auth.emitter.on('remoteSignIn', (payload) => {
      const data = this.extractDataFromPayload(payload);
      // write to config first to make sure it is stringifiable
      this._writeDataToConfig(data);
      this.onDataReceived(data);
    });
  }

  extractDataFromPayload(_payload: any): any {
    throw new Error('Child of LocalDataService needs to implement its own extractDataFromPayload method');
  }

  onDataReceived(_data: any): void {
    // do nothing on the parent class
  }

  async _readDataFromConfig(): Promise<any> {
    const strData = await readConfig((this.constructor as typeof LocalDataService).CONFIG_KEY);
    return JSON.parse(strData);
  }

  async _writeDataToConfig(data: any): Promise<void> {
    const strData = JSON.stringify(data);
    await writeConfig((this.constructor as typeof LocalDataService).CONFIG_KEY, strData);
  }
}
