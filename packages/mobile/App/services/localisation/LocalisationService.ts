import mitt from 'mitt';
import { get } from 'lodash';

import { AuthService } from '~/services/auth';
import { readConfig, writeConfig } from '~/services/config';

const TEST_LOCALISATION_OVERRIDES = {}; // add values to this to test localisation in development
const CONFIG_KEY = 'localisation';

export class LocalisationService {
  auth: AuthService;

  emitter = mitt();

  localisations: object;

  constructor(auth: AuthService) {
    this.auth = auth;
    this.auth.emitter.on('remoteSignIn', ({ localisation }) => {
      this.setLocalisations(localisation);
    });
    this._readLocalisationsFromConfig();
  }

  async _readLocalisationsFromConfig() {
    const strLocalisation = await readConfig(CONFIG_KEY);
    this._setLocalisationsWithoutWritingConfig(JSON.parse(strLocalisation));
  }

  _setLocalisationsWithoutWritingConfig(localisations: object) {
    this.localisations = localisations;
    this.emitter.emit('changed', this.localisations);
  }

  async setLocalisations(localisations: object) {
    // make sure we can stringify before setting localisation
    const jsonLocalisation = JSON.stringify(localisations);
    this._setLocalisationsWithoutWritingConfig(localisations);
    await writeConfig(CONFIG_KEY, jsonLocalisation);
  }

  getLocalisation(path: string) {
    const mergedLocalisations = { ...this.localisations, ...TEST_LOCALISATION_OVERRIDES };
    return get(mergedLocalisations, path);
  }

  getString(path: string, defaultValue?: string): string {
    const value = this.getLocalisation(path);
    if (typeof value === 'string') {
      return value;
    }
    if (typeof defaultValue === 'string') {
      return defaultValue;
    }
    return path;
  }

  getBool(path: string, defaultValue?: boolean): boolean {
    const value = this.getLocalisation(path);
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof defaultValue === 'boolean') {
      return defaultValue;
    }
    return false;
  }
}
