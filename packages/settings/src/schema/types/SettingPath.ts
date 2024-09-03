import { centralSettings } from "../central";
import { facilitySettings } from "../facility";
import { globalSettings } from "../global";
import { Setting } from "./Setting";

// Type to generate the dot prefix
type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;

// Utility type to join keys
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${Extract<K, string>}${DotPrefix<Extract<P, string>>}`
    : never
  : never;

// Utility type to check if an object is a setting
type IsSetting<T> = T extends Setting ? true : false;

// Extended utility type to exclude 'properties', 'description', 'name', and other ignored keys
type RemoveSchemaKeys<T> = T extends object
  ? IsSetting<T> extends true
    ? ''
    : {
        [K in keyof T]: K extends 'properties' | 'description' | 'name'
          ? RemoveSchemaKeys<T[K]>
          : K extends string | number
          ? Join<K, RemoveSchemaKeys<T[K]>>
          : never;
      }[keyof T]
  : '';

type SchemaProperties = typeof globalSettings.properties | typeof facilitySettings.properties | typeof centralSettings.properties;

export type SettingPath = RemoveSchemaKeys<SchemaProperties>;

