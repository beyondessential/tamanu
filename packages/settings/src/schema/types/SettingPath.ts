import { centralSettings } from '../central';
import { facilitySettings } from '../facility';
import { globalSettings } from '../global';
import { Setting } from './Setting';
import { SettingsSchema } from './SettingsSchema';
import {KEYS_EXPOSED_TO_FRONT_END} from '../../reader/ReadSettings'

// Type to generate the dot prefix
type Subscript<T extends string> = T extends '' ? '' : `.${T}`;

// Utility type to join keys
type Join<K, P> = K extends string
  ? P extends string
    ? `${Extract<K, string>}${Subscript<Extract<P, string>>}`
    : never
  : never;

// Extended utility type to exclude settings schema keys like 'properties', 'description', 'name'
type RemoveSchemaKeys<T> = T extends object
  ? T extends Setting
    ? ''
    : {
        [K in keyof T]: K extends keyof SettingsSchema
          ? RemoveSchemaKeys<T[K]>
          : K extends string
          ? Join<K, RemoveSchemaKeys<T[K]>>
          : never;
      }[keyof T]
  : '';

// Extract paths that start with a specific key
type StartsWith<T extends string, U extends string> = T extends `${U}.${string}` ? T : never;

type SchemaProperties = typeof globalSettings.properties | typeof facilitySettings.properties | typeof centralSettings.properties;

export type SettingPath = RemoveSchemaKeys<SchemaProperties>

// Filters paths based on KEYS_EXPOSED_TO_FRONT_END
export type FrontEndExposedSettingPath = StartsWith<SettingPath, typeof KEYS_EXPOSED_TO_FRONT_END[number]>;

