export class DataImportError extends Error {
  constructor(sheetName, rowIndex, error) {
    const rowNumber = rowIndex + 2; // correcting for zero-index and for header row

    let previous;
    if (typeof error === 'string') {
      previous = new Error(error);
    } else {
      previous = error;
    }

    if (previous instanceof Error) {
      super(`${previous.message} on ${sheetName} at row ${rowNumber}`);
    } else {
      throw new Error('DEV ERROR: pass either a string or Error error');
    }

    this.previous = previous;
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
export class UpsertionError extends DataImportError {}
export class ValidationError extends DataImportError {}
export class WorkSheetError extends DataImportError {}

export class ImporterMetadataError extends DataImportError {
  constructor(error) {
    super('Metadata', -2, error);
  }
}

export class DryRun extends Error {
  constructor() {
    super('Dry run: rollback');
  }
}
