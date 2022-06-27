export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email or password not correct.');
    this.name = 'InvalidCredentialsError';
  }
}

export class OutdatedVersionError extends Error {
  updateUrl: string;
  constructor(updateUrl: string) {
    super('Your Tamanu mobile app is out of date. Please download and install the latest version to continue using Tamanu.');
    this.updateUrl = updateUrl;
  }
}

export const noServerAccessMessage = 'Unable to access Server.\n Please check internet connection.';
export const invalidUserCredentialsMessage = 'Invalid user credentials.\nPlease check email and password and try again.';
export const invalidTokenMessage = 'User has been logged out of the server.';
export const generalErrorMessage = 'Oops, something went wrong.\n Please try again later!';
