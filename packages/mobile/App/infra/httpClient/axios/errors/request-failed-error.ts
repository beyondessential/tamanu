export class AxiosRequestFailedError extends Error {
  constructor() {
    super('Request failed');
    this.name = 'AxiosRequestFailedError';
  }
}
