import { last } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { FHIR_ISSUE_SEVERITY, FHIR_ISSUE_TYPE } from 'shared/constants';

export class FhirError extends Error {
  constructor(message, {
    status = 500,
    severity = FHIR_ISSUE_SEVERITY.ERROR,
    code = FHIR_ISSUE_TYPE.TRANSIENT._,
    diagnostics = null,
  } = {}) {
    super(message);
    this.status = status;
    this.severity = severity;
    this.code = code;
    this.diagnostics = diagnostics;
  }
  
  asFhir() {
    return {
      severity: this.severity,
      code: this.code,
      diagnostics: this.diagnostics ?? this.stack,
      details: {
        text: this.message,
      }
    };
  }
}

export class Unsupported extends FhirError {
  constructor(message) {
    super(message, {
      status: 501,
    });
  }
}

export class OperationOutcome {
  constructor(errors) {
    this.errors = errors.map(err => {
      if (err instanceof FhirError) {
        return err;
      }

      return new FhirError(err.toString(), {
        diagnostics: err.stack,
      });
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
