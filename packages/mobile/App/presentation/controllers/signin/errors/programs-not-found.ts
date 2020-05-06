export class ProgramsNotFoundError extends Error {
  constructor(serverMessage: string) {
    super(serverMessage);
    this.name = 'ProgramsNotFoundError';
  }
}
