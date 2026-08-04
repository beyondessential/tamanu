import * as yup from 'yup';

// Durations parsed by the `ms` package (e.g. jwt expiresIn): '90', '1h', '30d'
export const msDurationSchema = yup
  .string()
  .matches(/^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y)?$/i, 'must be a duration like ‘1h’ or ‘30d’');
