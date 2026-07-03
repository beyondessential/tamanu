import { createContext } from 'react';

// How many times saving has failed validation since the last successful save
// (or category change). The row editors reveal their inline errors once this
// is non-zero — Formik's own submitCount never increments here because the
// shared Form component replaces submitForm with a custom handler.
export const SettingsSubmitContext = createContext(0);
