export class DataImportError extends Error {
    constructor(sheetName, rowNumber, error) {
        if (typeof error === 'string') {
            super(`${error} on ${sheetName} at row ${rowNumber + 1}`);
        } else if (error instanceof Error) {
            super(`${error.message} on ${sheetName} at row ${rowNumber + 1}`);
            this.previous = error;
        } else {
            throw new Error('DEV ERROR: pass either a string or Error error');
        }
        
        this.sheetName = sheetName;
        this.rowNumber = rowNumber;
    }

    toJSON() {
        return {
            sheet: this.sheetName,
            row: this.rowNumber,
            message: this.message,
        };
    }
}

export class DataLoaderError extends DataImportError {}
export class ForeignkeyResolutionError extends DataImportError {}
export class UpstertionError extends DataImportError {}
export class ValidationError extends DataImportError {}
export class WorkSheetError extends DataImportError {}

export class DryRun extends Error {
  constructor() {
    super('Dry run: rollback');
  }
}