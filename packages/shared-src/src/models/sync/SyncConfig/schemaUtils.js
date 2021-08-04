import * as yup from 'yup';

export const func = opts =>
  yup.object(opts).test(
    'is-function',
    (value, { path }) => `${path} is not a function`,
    value => typeof value === 'function',
  );

export const isTruthy = v => !!v;
