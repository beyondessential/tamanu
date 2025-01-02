import { DataTypes, type InitOptions as BaseInitOptions, type Model as BaseModel } from 'sequelize';
import { toDateString, toDateTimeString } from '@tamanu/utils/dateTime';
import * as models from '../models';
import type { Model } from '../models/Model';
import type { SyncDirectionValues } from './sync';

type PrimaryKey = {
  type: typeof DataTypes.STRING;
  defaultValue: unknown extends string ? string : never;
  allowNull: boolean;
  primaryKey: boolean;
};

export interface InitOptions extends BaseInitOptions {
  syncDirection: SyncDirectionValues;
  primaryKey: PrimaryKey;
  hackToSkipEncounterValidation?: boolean;
}

export type Models = typeof models;

type NonFunctionKeys<T> = { [P in keyof T]: T[P] extends Function ? never : P }[keyof T];
export type ModelProperties<T> = Omit<Pick<T, NonFunctionKeys<T>>, keyof BaseModel>;

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
