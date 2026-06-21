import { ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';

// Just copying this from tamanu web constants for now
const LOCAL_STORAGE_KEYS = {
  LANGUAGE: 'language',
};

export const getCurrentLanguageCode = () =>
  window?.localStorage?.getItem(LOCAL_STORAGE_KEYS.LANGUAGE) || ENGLISH_LANGUAGE_CODE;
