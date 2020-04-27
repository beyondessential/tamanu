export class ServerRequestError extends Error {
  constructor(stackError?: string) {
    super();
    this.name = 'ServerRequestError';
    this.message = stackError || 'Undefined Error';
  }
}
