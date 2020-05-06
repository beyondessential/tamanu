export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email or password not correct.');
    this.name = 'InvalidCredentialsError';
  }
}
