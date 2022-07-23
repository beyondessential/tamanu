export class DataImportError extends Error {
    constructor(sheetName, rowNumber, error) {
        if (typeof error === 'string') {
            super(`${error} on ${sheetName}:${rowNumber}`);
        } else if (error instanceof Error) {
            super(`${error.message} on ${sheetName}:${rowNumber}`);
            this.previous = error;
        } else {
            throw new Error('DEV ERROR: pass either a string or Error error');
        }
    }
}

export class DataLoaderError extends DataImportError {}
export class ForeignkeyResolutionError extends DataImportError {}
export class UpstertionError extends DataImportError {}
export class ValidationError extends DataImportError {}
export class WorkSheetError extends DataImportError {}

class DryRun extends Error {
  constructor() {
    super('Dry run: rollback');
  }
}