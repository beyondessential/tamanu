import { last } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { FHIR_ISSUE_SEVERITY, FHIR_ISSUE_TYPE } from 'shared/constants';

export class FhirError extends Error {
  constructor(
    message,
    {
      status = 500,
      severity = FHIR_ISSUE_SEVERITY.ERROR,
      code = FHIR_ISSUE_TYPE.TRANSIENT._,
      diagnostics = null,
      expression = undefined,
    } = {},
  ) {
    super(message);
    this.status = status;
    this.severity = severity;
    this.code = code;
    this.diagnostics = diagnostics;
    this.expression = expression;
  }

  asFhir() {
    return {
      severity: this.severity,
      code: this.code,
      diagnostics: this.diagnostics ?? this.stack,
      expression: this.expression,
      details: {
        text: this.message,
      },
    };
  }
}

export class Invalid extends FhirError {
  constructor(message, options = {}) {
    super(message, {
      status: 400,
      code: FHIR_ISSUE_TYPE.INVALID._,
      ...options,
    });
  }
}

export class Unsupported extends FhirError {
  constructor(message, options = {}) {
    super(message, {
      status: 501,
      code: FHIR_ISSUE_TYPE.PROCESSING.NOT_SUPPORTED,
      ...options,
    });
  }
}

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
}
