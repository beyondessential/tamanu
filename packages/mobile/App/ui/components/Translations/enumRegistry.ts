import {
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
  PROGRAM_REGISTRATION_STATUS_LABELS,
} from '~/constants/programRegistries';

type EnumKeys = keyof typeof registeredEnums;
type EnumValues = (typeof registeredEnums)[EnumKeys];
type EnumEntries = [EnumKeys, EnumValues][];

// These are all taken from constants and shared packages.
// Whenever adding a new supported enum ensure that the mobile
// version matches 100% the constants package version.
const registeredEnums = {
  PROGRAM_REGISTRATION_STATUS_LABELS,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
};

const translationPrefixes: Record<EnumKeys, string> = {
  PROGRAM_REGISTRATION_STATUS_LABELS: 'programRegistry.property.registrationStatus',
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS: 'programRegistry.property.conditionCategory',
};

const prefixMap = new Map(
  (Object.entries(registeredEnums) as EnumEntries).map(([key, enumValue]) => [
    enumValue,
    translationPrefixes[key],
  ]),
);

export const getEnumPrefix = (enumValues) => prefixMap.get(enumValues);
