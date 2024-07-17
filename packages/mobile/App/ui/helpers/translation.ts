import { ReferenceDataTranslationPrefix } from './constants';

export const getReferenceDataStringId = (refDataType: string, value: string): string => {
  return `${ReferenceDataTranslationPrefix}.${refDataType}.${value}`;
};
