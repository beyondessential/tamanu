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

  static get kind() {
    return 'DataImportError';
  }

  toJSON() {
    return {
      sheet: this.sheetName,
      row: this.rowNumber,
      kind: this.constructor.kind,
      message: this.previous.toString(),
    };
  }
}

export class DataLoaderError extends DataImportError {
  static get kind() {
    return 'DataLoaderError';
  }
}
export class ForeignkeyResolutionError extends DataImportError {
  static get kind() {
    return 'ForeignkeyResolutionError';
  }
}
export class UpsertionError extends DataImportError {
  static get kind() {
    return 'UpsertionError';
  }
}
export class ValidationError extends DataImportError {
  static get kind() {
    return 'ValidationError';
  }
}
export class WorkSheetError extends DataImportError {
  static get kind() {
    return 'WorkSheetError';
  }
}

export class ImporterMetadataError extends DataImportError {
  constructor(error) {
    super('metadata', -2, error);
  }

  static get kind() {
    return 'ImporterMetadataError';
  }
}

export class DryRun extends Error {
  constructor() {
    super('Dry run: rollback');
  }
}
