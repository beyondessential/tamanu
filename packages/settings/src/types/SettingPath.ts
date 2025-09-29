import { centralSettings } from '../schema/central';
import { facilitySettings } from '../schema/facility';
import { globalSettings } from '../schema/global';
import { Setting } from './Setting';
import { SettingsSchema } from './SettingsSchema';

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

// Utility type to extract keys from settings that have exposedToWeb: true
type ExtractExposedKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends keyof SettingsSchema
        ? ExtractExposedKeys<T[K]>
        : K extends string
          ? T[K] extends { exposedToWeb: true }
            ? K
            : T[K] extends object
              ? ExtractExposedKeys<T[K]> extends never
                ? never
                : Join<K, ExtractExposedKeys<T[K]>>
              : never
          : never;
    }[keyof T]
  : never;

type SchemaProperties =
  | typeof globalSettings.properties
  | typeof facilitySettings.properties
  | typeof centralSettings.properties;
type FacilityScopedProperties =
  | typeof facilitySettings.properties
  | typeof globalSettings.properties;
type CentralScopedProperties = typeof centralSettings.properties | typeof globalSettings.properties;

export type SettingPath = RemoveSchemaKeys<SchemaProperties>;
export type FacilitySettingPath = RemoveSchemaKeys<FacilityScopedProperties>;
export type CentralSettingPath = RemoveSchemaKeys<CentralScopedProperties>;
export type FrontEndExposedSettingPath =
  | ExtractExposedKeys<typeof globalSettings>
  | ExtractExposedKeys<typeof facilitySettings>;
