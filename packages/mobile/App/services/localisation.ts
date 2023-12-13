import { get } from 'lodash';
import mitt from 'mitt';

import { LocalDataService } from './localData';

const TEST_LOCALISATION_OVERRIDES = {}; // add values to this to test localisation in development

const isArrayOfStrings = (value: unknown): boolean =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

export class LocalisationService extends LocalDataService {
  static CONFIG_KEY = 'localisation';

  emitter = mitt();

  localisations: object;

  extractDataFromPayload(payload: any): object {
    return payload.localisation;
  }

  onDataLoaded(): void {
    this.emitter.emit('localisationChanged');
  }

  getLocalisation(path: string): any {
    const mergedLocalisations = { ...this.data, ...TEST_LOCALISATION_OVERRIDES };
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

  getArrayOfStrings(path: string, defaultValue?: string[]): string[] {
    const value = this.getLocalisation(path);
    if (isArrayOfStrings(value)) {
      return value;
    }
    if (isArrayOfStrings(defaultValue)) {
      return defaultValue;
    }
    return [];
  }
}
