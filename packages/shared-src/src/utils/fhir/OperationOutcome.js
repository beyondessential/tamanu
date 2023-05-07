import { last } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { FhirError, Invalid } from './errors';
import { FHIR_ISSUE_SEVERITY } from '../../constants/fhir';

export class OperationOutcome extends Error {
  constructor(errors) {
    super('OperationOutcome: one or more errors (THIS SHOULD NEVER BE SEEN)');
    this.errors = errors.flatMap(err => {
      if (err instanceof OperationOutcome) {
        return err.errors;
      }

      if (err instanceof FhirError) {
        return [err];
      }

      return [
        new FhirError(err.toString(), {
          diagnostics: err.stack,
        }),
      ];
    });
  }

  status() {
    const codes = this.errors.map(err => err.status);
    codes.sort();
    return last(codes);
  }

  asFhir() {
    return {
      resourceType: 'OperationOutcome',
      id: uuidv4(),
      issue: this.errors.map(err => err.asFhir()),
    };
  }

  /**
   * Downgrade all errors to warning severity, leave informationals alone.
   *
   * This is useful (and required!) when returning issues alongside a successful
   * response.
   */
  downgradeErrorsToWarnings() {
    this.errors.forEach(err => {
      if (!(err instanceof FhirError)) return;

      if (err.severity !== FHIR_ISSUE_SEVERITY.INFORMATION) {
        // eslint-disable-next-line no-param-reassign
        err.severity = FHIR_ISSUE_SEVERITY.WARNING;
      }
    });
  }

  static fromYupError(validationError /*: ValidationError */, pathPrefix = undefined) {
    const errors = [];
    if (validationError.inner.length > 0) {
      for (const error of validationError.inner) {
        errors.push(
          new Invalid(error.message, {
            expression: [pathPrefix, error.path].filter(x => x).join('.') || undefined,
          }),
        );
      }
    } else {
      errors.push(new Invalid(validationError.message, { expression: pathPrefix }));
    }

    return new this(errors);
  }
}
