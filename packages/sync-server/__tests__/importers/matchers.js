import matchers from 'expect/build/matchers';

import { ValidationError, ForeignkeyResolutionError } from '../../app/admin/errors';

function toContainError(errors, { ofType, inSheet, atRow, withMessage }) {
  return matchers.toContain(
    errors.map(error => `${error.constructor.name}: ${error.message}`),
    `${ofType.name}: ${withMessage} on ${inSheet} at row ${atRow}`,
  );
}

function toContainValidationError(errors, inSheet, atRow, withMessage) {
  return toContainError(errors, { ofType: ValidationError, inSheet, atRow, withMessage });
}

function toContainFkError(errors, inSheet, atRow, withMessage) {
  return toContainError(errors, { ofType: ForeignkeyResolutionError, inSheet, atRow, withMessage });
}

expect.extend({ toContainError, toContainValidationError, toContainFkError });
