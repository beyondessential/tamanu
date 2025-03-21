import { ForeignkeyResolutionError, ValidationError } from '../../dist/admin/errors';

function toContainError(errors, { ofType = null, inSheet, atRow, withMessage }) {
  const suffix = `on ${inSheet} at row ${atRow}`;
  const matchingErrors = errors.filter(err => {
    if (ofType && !(err instanceof ofType)) return false;
    if (!err.message.endsWith(suffix)) return false;
    if (!err.message.includes(withMessage)) return false;
    return true;
  });
  const pass = matchingErrors.length > 0;
  const not_ = pass ? 'not ' : '';
  return {
    message: () =>
      `Expected ${not_}to have a ${ofType?.name ??
        ''} error containing "${withMessage}" ${suffix}; found ${errors.map(
        e => `${e.constructor.name}: ${e.message}`,
      )}.`,
    pass,
  };
}

function toContainValidationError(errors, inSheet, atRow, withMessage) {
  return toContainError(errors, { ofType: ValidationError, inSheet, atRow, withMessage });
}

function toContainFkError(errors, inSheet, atRow, withMessage) {
  return toContainError(errors, { ofType: ForeignkeyResolutionError, inSheet, atRow, withMessage });
}

function toContainAnError(errors, inSheet, atRow, withMessage) {
  return toContainError(errors, { inSheet, atRow, withMessage });
}

expect.extend({ toContainAnError, toContainValidationError, toContainFkError });
