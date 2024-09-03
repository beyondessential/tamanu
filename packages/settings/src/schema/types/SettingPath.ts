import { centralSettings } from "../central";
import { facilitySettings } from "../facility";
import { globalSettings } from "../global";

type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;

// Utility type to concatenate keys, skipping `.properties`
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${Extract<K, string>}${DotPrefix<Extract<P, string>>}`
    : never
  : never;

// Utility type to check if an object is a leaf node
type IsLeafNode<T> = T extends { type: any; defaultValue: any } ? true : false;

type RemovePropertiesKey<T> = T extends object
  ? IsLeafNode<T> extends true
    ? ''
    : {
        [K in keyof T]: K extends 'properties'
          ? RemovePropertiesKey<T[K]>
          : K extends string | number
          ? Join<K, RemovePropertiesKey<T[K]>>
          : never;
      }[keyof T]
  : '';

type SchemaProperties = typeof globalSettings.properties | typeof facilitySettings.properties | typeof centralSettings.properties;

export type SettingPath = RemovePropertiesKey<SchemaProperties>;
