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

export const REPORT_VERSION_EXPORT_FORMATS = {
  SQL: 'sql',
  JSON: 'json',
};

export const REPORT_STATUSES = { DRAFT: 'draft', PUBLISHED: 'published' };

export const REPORT_STATUSES_VALUES = Object.values(REPORT_STATUSES);

export const REPORT_DEFAULT_DATE_RANGES = {
  ALL_TIME: 'allTime',
  THIRTY_DAYS: '30days',
};
export const REPORT_DATE_RANGE_LABELS = {
  [REPORT_DEFAULT_DATE_RANGES.ALL_TIME]: 'Date range (or leave blank for all data)',
  [REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS]:
    'Date range (or leave blank for the past 30 days of data)',
};

export const REPORT_DEFAULT_DATE_RANGES_VALUES = Object.values(REPORT_DEFAULT_DATE_RANGES);

export const REPORT_DB_ROLES = {
  REPORTING: 'reporting',
  RAW: 'raw',
};
