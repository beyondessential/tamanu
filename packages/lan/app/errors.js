class BaseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends BaseError {}
export class BadAuthenticationError extends BaseError {}
export class ForbiddenError extends BaseError {}
