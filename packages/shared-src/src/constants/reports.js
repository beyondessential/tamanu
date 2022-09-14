export const REPORT_REQUEST_STATUSES = {
  RECEIVED: 'Received',
  PROCESSING: 'Processing',
  PROCESSED: 'Processed',
  ERROR: 'Error',
};

export const REPORT_REQUEST_STATUS_VALUES = Object.values(REPORT_REQUEST_STATUSES);

export const REPORT_DATA_SOURCES = {
  THIS_FACILITY: 'thisFacility',
  ALL_FACILITIES: 'allFacilities',
};

export const REPORT_DATA_SOURCE_VALUES = Object.values(REPORT_DATA_SOURCES);

export const REPORT_EXPORT_FORMATS = {
  XLSX: 'xlsx',
  CSV: 'csv',
};
