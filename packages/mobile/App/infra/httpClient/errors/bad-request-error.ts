export class BadRequestError extends Error {
  constructor() {
    super();
    this.message = 'Bad Request';
  }
}
