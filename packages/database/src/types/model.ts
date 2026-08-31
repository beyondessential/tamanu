import {
  DataTypes,
  Utils,
  type InitOptions as BaseInitOptions,
  type Model as BaseModel,
} from 'sequelize';
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

// A literal or column reference is SQL for the database to evaluate, so it goes through
// untouched rather than being parsed as a date.
const isSqlFragment = (value: unknown) => value instanceof Utils.SequelizeMethod;

type DateSetterInput = null | string | Date | InstanceType<typeof Utils.SequelizeMethod>;

// Used for storing date time strings in database
export function dateTimeType(fieldName: string, config = {}) {
  return {
    type: DataTypes.DATETIMESTRING,
    set(this: Model, value?: DateSetterInput) {
      this.setDataValue(
        fieldName,
        isSqlFragment(value) ? value : toDateTimeString(value as null | string | Date),
      );
    },
    ...config,
  };
}

// Used for storing date only strings in database
export function dateType(fieldName: string, config = {}) {
  return {
    type: DataTypes.DATESTRING,
    set(this: Model, value?: DateSetterInput) {
      this.setDataValue(
        fieldName,
        isSqlFragment(value) ? value : toDateString(value as null | string | Date),
      );
    },
    ...config,
  };
}
