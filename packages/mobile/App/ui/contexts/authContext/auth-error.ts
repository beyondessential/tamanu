export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export const noServerAccessMessage = `Unable to access Server.\n Please check internet connection.`;
export const invalidUserCredentialsMessage = `Invalid user credentials.\nPlease check email and password and try again.`;
export const generalErrorMessage = `Oops, something went wrong.\n Please try again later!`;
