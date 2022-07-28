export class DataImportError extends Error {
  constructor(sheetName, rowNumber, error) {
    rowNumber += 2; // correcting for zero-index and for header row

    if (typeof error === 'string') {
      error = new Error(error);
    }

    if (error instanceof Error) {
      super(`${error.message} on ${sheetName} at row ${rowNumber}`);
    } else {
      throw new Error('DEV ERROR: pass either a string or Error error');
    }

    this.previous = error;
    this.sheetName = sheetName;
    this.rowNumber = rowNumber;
  }

  toJSON() {
    return {
      sheet: this.sheetName,
      row: this.rowNumber,
      kind: this.constructor.name,
      message: this.previous.toString(),
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
