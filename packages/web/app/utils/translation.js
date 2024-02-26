import { LOCAL_STORAGE_KEYS } from '../constants';

export const getCurrentLanguageCode = () => localStorage.getItem(LOCAL_STORAGE_KEYS.LANGUAGE) || 'en';