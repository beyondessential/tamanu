import { DataTypes, type InitOptions as BaseInitOptions, type ModelStatic } from 'sequelize';
import { toDateString, toDateTimeString } from '@tamanu/utils/dateTime';
import type { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export interface InitOptions extends BaseInitOptions {
  syncDirection: SyncDirectionValues;
  primaryKey?: any;
}

type ModelName =
  | 'Encounter'
  | 'ScheduledVaccine'
  | 'AdministeredVaccine'
  | 'User'
  | 'Location'
  | 'Department'
  | 'ReferenceData';

export type Models = {
  // eslint-disable-next-line no-unused-vars
  [key in ModelName]: ModelStatic<any>;
};

export type SyncDirectionValues = (typeof SYNC_DIRECTIONS)[keyof typeof SYNC_DIRECTIONS];

// Used for storing date time strings in database
export function dateTimeType(fieldName: string, config = {}) {
  return {
    type: DataTypes.DATETIMESTRING,
    set(this: Model, value?: null | string | Date) {
      this.setDataValue(fieldName, toDateTimeString(value));
    },
    ...config,
  };
}

// Used for storing date only strings in database
export function dateType(fieldName: string, config = {}) {
  return {
    type: DataTypes.DATESTRING,
    set(this: Model, value?: null | string | Date) {
      this.setDataValue(fieldName, toDateString(value));
    },
    ...config,
  };
}
