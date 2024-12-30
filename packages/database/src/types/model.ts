import { DataTypes, type InitOptions as BaseInitOptions } from 'sequelize';
import { toDateString, toDateTimeString } from '@tamanu/utils/dateTime';
import type { SYNC_DIRECTIONS } from '@tamanu/constants';
import * as models from '../models';
import type { Model } from '../models/Model';

export type SyncDirectionValues = (typeof SYNC_DIRECTIONS)[keyof typeof SYNC_DIRECTIONS];

export interface InitOptions extends BaseInitOptions {
  syncDirection: SyncDirectionValues;
  primaryKey?: any;
}

export type Models = typeof models;

type NonConstructorKeys<T> = ({[P in keyof T]: T[P] extends new () => any ? never : P })[keyof T];
type NonConstructor<T> = Pick<T, NonConstructorKeys<T>>;
export type ModelStatic<M extends Model> = NonConstructor<typeof Model> & { new(): M };

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
