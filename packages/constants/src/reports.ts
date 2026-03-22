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

export const REPORT_DATA_SOURCE_LABELS = {
  [REPORT_DATA_SOURCES.THIS_FACILITY]: 'This facility',
  [REPORT_DATA_SOURCES.ALL_FACILITIES]: 'All facilities',
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

export const REPORT_STATUS_LABELS = {
  [REPORT_STATUSES.DRAFT]: 'Draft',
  [REPORT_STATUSES.PUBLISHED]: 'Published',
};

export const REPORT_STATUSES_VALUES = Object.values(REPORT_STATUSES);

export const REPORT_DEFAULT_DATE_RANGES = {
  ALL_TIME: 'allTime',
  EIGHTEEN_YEARS: '18years',
  THIRTY_DAYS: '30days',
  SEVEN_DAYS: '7days',
  TWENTY_FOUR_HOURS: '24hours',
  NEXT_THIRTY_DAYS: 'next30days',
};

export const REPORT_DEFAULT_DATE_RANGES_LABELS = {
  [REPORT_DEFAULT_DATE_RANGES.ALL_TIME]: 'All time',
  [REPORT_DEFAULT_DATE_RANGES.EIGHTEEN_YEARS]: 'Past 18 years',
  [REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS]: 'Past 30 days',
  [REPORT_DEFAULT_DATE_RANGES.SEVEN_DAYS]: 'Past 7 days',
  [REPORT_DEFAULT_DATE_RANGES.TWENTY_FOUR_HOURS]: 'Past 24 hours',
  [REPORT_DEFAULT_DATE_RANGES.NEXT_THIRTY_DAYS]: 'Next 30 days',
};

export const REPORT_DATE_RANGE_LABELS = {
  [REPORT_DEFAULT_DATE_RANGES.ALL_TIME]: 'Date range (or leave blank for all data)',
  [REPORT_DEFAULT_DATE_RANGES.EIGHTEEN_YEARS]:
    'Date range (or leave blank for the past 18 years of data)',
  [REPORT_DEFAULT_DATE_RANGES.THIRTY_DAYS]:
    'Date range (or leave blank for the past 30 days of data)',
  [REPORT_DEFAULT_DATE_RANGES.SEVEN_DAYS]:
    'Date range (or leave blank for the past 7 days of data)',
  [REPORT_DEFAULT_DATE_RANGES.TWENTY_FOUR_HOURS]:
    'Date range (or leave blank for the past 24 hours of data)',
  [REPORT_DEFAULT_DATE_RANGES.NEXT_THIRTY_DAYS]:
    'Date range (or leave blank for the next 30 days of data)',
};

export const REPORT_DEFAULT_DATE_RANGES_VALUES = Object.values(REPORT_DEFAULT_DATE_RANGES);

export const REPORT_DB_CONNECTIONS = {
  REPORTING: 'reporting',
  RAW: 'raw',
};

export const REPORT_DB_CONNECTION_VALUES = Object.values(REPORT_DB_CONNECTIONS);

export const REPORT_DB_CONNECTION_LABELS = {
  [REPORT_DB_CONNECTIONS.REPORTING]: 'Reporting',
  [REPORT_DB_CONNECTIONS.RAW]: 'Raw',
};

export const REPORT_DB_CONNECTION_SCHEMAS = {
  [REPORT_DB_CONNECTIONS.REPORTING]: 'reporting',
  [REPORT_DB_CONNECTIONS.RAW]: 'public',
};
