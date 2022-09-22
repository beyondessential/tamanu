export class FhirError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export class Unsupported extends FhirError {
  constructor(message) {
    super(422, message);
  }
}
