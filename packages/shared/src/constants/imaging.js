import { IMAGING_REQUEST_STATUS_TYPES } from './statuses';

export const IMAGING_AREA_TYPES = {
  X_RAY_IMAGING_AREA: 'xRayImagingArea',
  ULTRASOUND_IMAGING_AREA: 'ultrasoundImagingArea',
  CT_SCAN_IMAGING_AREA: 'ctScanImagingArea',
  ECHOCARDIOGRAM_IMAGING_AREA: 'echocardiogramImagingArea',
  MRI_IMAGING_AREA: 'mriImagingArea',
  MAMMOGRAM_IMAGING_AREA: 'mammogramImagingArea',
  ECG_IMAGING_AREA: 'ecgImagingArea',
  HOLTER_MONITOR_IMAGING_AREA: 'holterMonitorImagingArea',
  ENDOSCOPY_IMAGING_AREA: 'endoscopyImagingArea',
  FLUROSCOPY_IMAGING_AREA: 'fluroscopyImagingArea',
  ANGIOGRAM_IMAGING_AREA: 'angiogramImagingArea',
  COLONOSCOPY_IMAGING_AREA: 'colonoscopyImagingArea',
  VASCULAR_STUDY_IMAGING_AREA: 'vascularStudyImagingArea',
  STRESS_TEST_IMAGING_AREA: 'stressTestImagingArea',
};

export const IMAGING_TYPES = {
  X_RAY: 'xRay',
  CT_SCAN: 'ctScan',
  ULTRASOUND: 'ultrasound',
  MRI: 'mri',
  ECG: 'ecg',
  HOLTER_MONITOR: 'holterMonitor',
  ECHOCARDIOGRAM: 'echocardiogram',
  MAMMOGRAM: 'mammogram',
  ENDOSCOPY: 'endoscopy',
  FLUROSCOPY: 'fluroscopy',
  ANGIOGRAM: 'angiogram',
  COLONOSCOPY: 'colonoscopy',
  VASCULAR_STUDY: 'vascularStudy',
  STRESS_TEST: 'stressTest',
};

export const IMAGING_TYPES_VALUES = Object.values(IMAGING_TYPES);

export const AREA_TYPE_TO_IMAGING_TYPE = {
  [IMAGING_AREA_TYPES.X_RAY_IMAGING_AREA]: IMAGING_TYPES.X_RAY,
  [IMAGING_AREA_TYPES.CT_SCAN_IMAGING_AREA]: IMAGING_TYPES.CT_SCAN,
  [IMAGING_AREA_TYPES.ULTRASOUND_IMAGING_AREA]: IMAGING_TYPES.ULTRASOUND,
  [IMAGING_AREA_TYPES.MRI_IMAGING_AREA]: IMAGING_TYPES.MRI,
  [IMAGING_AREA_TYPES.ECG_IMAGING_AREA]: IMAGING_TYPES.ECG,
  [IMAGING_AREA_TYPES.HOLTER_MONITOR_IMAGING_AREA]: IMAGING_TYPES.HOLTER_MONITOR,
  [IMAGING_AREA_TYPES.ECHOCARDIOGRAM_IMAGING_AREA]: IMAGING_TYPES.ECHOCARDIOGRAM,
  [IMAGING_AREA_TYPES.MAMMOGRAM_IMAGING_AREA]: IMAGING_TYPES.MAMMOGRAM,
  [IMAGING_AREA_TYPES.ENDOSCOPY_IMAGING_AREA]: IMAGING_TYPES.ENDOSCOPY,
  [IMAGING_AREA_TYPES.FLUROSCOPY_IMAGING_AREA]: IMAGING_TYPES.FLUROSCOPY,
  [IMAGING_AREA_TYPES.ANGIOGRAM_IMAGING_AREA]: IMAGING_TYPES.ANGIOGRAM,
  [IMAGING_AREA_TYPES.COLONOSCOPY_IMAGING_AREA]: IMAGING_TYPES.COLONOSCOPY,
  [IMAGING_AREA_TYPES.VASCULAR_STUDY_IMAGING_AREA]: IMAGING_TYPES.VASCULAR_STUDY,
  [IMAGING_AREA_TYPES.STRESS_TEST_IMAGING_AREA]: IMAGING_TYPES.STRESS_TEST,
};

// These are the status groupings for the versions of imaging request table that filter by different statuses
// This object is used to store the grouping for filtering but also to generate a code from the statuses
export const IMAGING_TABLE_STATUS_GROUPINGS = {
  ACTIVE: [IMAGING_REQUEST_STATUS_TYPES.PENDING, IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS],
  COMPLETED: [IMAGING_REQUEST_STATUS_TYPES.COMPLETED],
};

// Here we create an object constant that contains the code and statuses for each version of the imaging request table
// This is used for tracking the search memory of each table and also containing the statuses to be filtered by
export const IMAGING_TABLE_VERSIONS = Object.keys(IMAGING_TABLE_STATUS_GROUPINGS).reduce(
  (acc, key) => {
    const value = IMAGING_TABLE_STATUS_GROUPINGS[key];
    acc[key] = {
      memoryKey: value.join('-'),
      statuses: value,
    };
    return acc;
  },
  {},
);
