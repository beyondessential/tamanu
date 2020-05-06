export class UnauthorizedRequestError extends Error {
  constructor() {
    super();
    this.message = 'UnauthorizedRequest';
  }
}
