export class RequestFailedError extends Error {
  constructor() {
    super('Request failed');
    this.name = 'RequestFailedError';
  }
}
