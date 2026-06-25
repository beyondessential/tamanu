import { LOCAL_STORAGE_KEYS } from '../constants';
import { ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';

export const getCurrentLanguageCode = () =>
  window?.localStorage?.getItem(LOCAL_STORAGE_KEYS.LANGUAGE) || ENGLISH_LANGUAGE_CODE;
