import { FHIR_ISSUE_SEVERITY, FHIR_ISSUE_TYPE } from '../../constants/fhir';

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
      diagnostics: this.diagnostics || this.stack,
      expression: this.expression,
      details: {
        text: this.message,
      },
    };
  }
}

// Developer error
export class Exception extends FhirError {
  constructor(message, options = {}) {
    super(message, {
      status: 500,
      code: FHIR_ISSUE_TYPE.TRANSIENT.EXCEPTION,
      ...options,
    });
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

export class Processing extends FhirError {
  constructor(message, options = {}) {
    super(message, {
      status: 500,
      code: FHIR_ISSUE_TYPE.PROCESSING._,
      ...options,
    });
  }
}

export class Unsupported extends Processing {
  constructor(message, options = {}) {
    super(message, {
      status: 501,
      code: FHIR_ISSUE_TYPE.PROCESSING.NOT_SUPPORTED,
      ...options,
    });
  }
}

export class NotFound extends Processing {
  constructor(message, options = {}) {
    super(message, {
      status: 404,
      code: FHIR_ISSUE_TYPE.PROCESSING.NOT_FOUND._,
      ...options,
    });
  }
}

export class Deleted extends Processing {
  constructor(message, options = {}) {
    super(message, {
      status: 410,
      code: FHIR_ISSUE_TYPE.PROCESSING.NOT_FOUND.DELETED,
      ...options,
    });
  }
}
