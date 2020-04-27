export class GeneralServerError extends Error {
  constructor() {
    super('General server Error');
    this.name = 'GeneralServerError';
  }
}
