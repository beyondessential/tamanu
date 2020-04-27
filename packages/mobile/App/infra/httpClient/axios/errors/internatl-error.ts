export class AxiosInternalError extends Error {
  constructor(errorMessage: string) {
    super(errorMessage);
    this.name = 'AxiosInternalError';
  }
}
