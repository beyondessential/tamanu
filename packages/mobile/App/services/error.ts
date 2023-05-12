type RemoteErrorPayload = {
  name?: string;
  message?: string;
};

export class RemoteError extends Error {
  status?: number;
  remoteError?: RemoteErrorPayload;
  constructor(message: string, remoteError: RemoteErrorPayload | undefined, status: number) {
    super(message);
    this.remoteError = remoteError;
    this.status = status;
  }
}

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
    super(
      'Your Tamanu mobile app is out of date. Please download and install the latest version to continue using Tamanu.',
    );
    this.updateUrl = updateUrl;
  }
}

export const noServerAccessMessage = 'Unable to access Server.\n Please check internet connection.';
export const invalidUserCredentialsMessage =
  'Invalid user credentials.\nPlease check email and password and try again.';
export const invalidTokenMessage = 'Your login has expired, please sign out and back in.';
export const generalErrorMessage = 'Oops, something went wrong.\n Please try again later!';
