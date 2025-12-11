import { IMAGING_REQUEST_STATUS_TYPES } from './statuses.js';

export const IMAGING_AREA_TYPES = {
  ANGIOGRAM_IMAGING_AREA: 'angiogramImagingArea',
  COLONOSCOPY_IMAGING_AREA: 'colonoscopyImagingArea',
  CT_SCAN_IMAGING_AREA: 'ctScanImagingArea',
  ECG_IMAGING_AREA: 'ecgImagingArea',
  ECHOCARDIOGRAM_IMAGING_AREA: 'echocardiogramImagingArea',
  ENDOSCOPY_IMAGING_AREA: 'endoscopyImagingArea',
  FLUROSCOPY_IMAGING_AREA: 'fluroscopyImagingArea',
  HOLTER_MONITOR_IMAGING_AREA: 'holterMonitorImagingArea',
  ORTHOPANTOMOGRAPHY_IMAGING_AREA: 'orthopantomographyImagingArea',
  MRI_IMAGING_AREA: 'mriImagingArea',
  MAMMOGRAM_IMAGING_AREA: 'mammogramImagingArea',
  MAMMOGRAM_SCREEN_IMAGING_AREA: 'mammogramScreenImagingArea',
  MAMMOGRAM_DIAG_IMAGING_AREA: 'mammogramDiagImagingArea',
  STRESS_TEST_IMAGING_AREA: 'stressTestImagingArea',
  ULTRASOUND_IMAGING_AREA: 'ultrasoundImagingArea',
  VASCULAR_STUDY_IMAGING_AREA: 'vascularStudyImagingArea',
  X_RAY_IMAGING_AREA: 'xRayImagingArea',
};

export const IMAGING_TYPES = {
  ANGIOGRAM: 'angiogram',
  COLONOSCOPY: 'colonoscopy',
  CT_SCAN: 'ctScan',
  ECG: 'ecg',
  ECHOCARDIOGRAM: 'echocardiogram',
  ENDOSCOPY: 'endoscopy',
  FLUROSCOPY: 'fluroscopy',
  HOLTER_MONITOR: 'holterMonitor',
  MAMMOGRAM: 'mammogram',
  MAMMOGRAM_SCREEN: 'mammogramScreen',
  MAMMOGRAM_DIAG: 'mammogramDiag', // Awkwardly truncating here to avoid max char limit on reference data import
  ORTHOPANTOMOGRAPHY: 'orthopantomography',
  MRI: 'mri',
  STRESS_TEST: 'stressTest',
  ULTRASOUND: 'ultrasound',
  VASCULAR_STUDY: 'vascularStudy',
  X_RAY: 'xRay',
};

export const IMAGING_TYPES_VALUES = Object.values(IMAGING_TYPES);

export const AREA_TYPE_TO_IMAGING_TYPE = {
  [IMAGING_AREA_TYPES.X_RAY_IMAGING_AREA]: IMAGING_TYPES.X_RAY,
  [IMAGING_AREA_TYPES.CT_SCAN_IMAGING_AREA]: IMAGING_TYPES.CT_SCAN,
  [IMAGING_AREA_TYPES.ORTHOPANTOMOGRAPHY_IMAGING_AREA]: IMAGING_TYPES.ORTHOPANTOMOGRAPHY,
  [IMAGING_AREA_TYPES.ULTRASOUND_IMAGING_AREA]: IMAGING_TYPES.ULTRASOUND,
  [IMAGING_AREA_TYPES.MRI_IMAGING_AREA]: IMAGING_TYPES.MRI,
  [IMAGING_AREA_TYPES.ECG_IMAGING_AREA]: IMAGING_TYPES.ECG,
  [IMAGING_AREA_TYPES.HOLTER_MONITOR_IMAGING_AREA]: IMAGING_TYPES.HOLTER_MONITOR,
  [IMAGING_AREA_TYPES.ECHOCARDIOGRAM_IMAGING_AREA]: IMAGING_TYPES.ECHOCARDIOGRAM,
  [IMAGING_AREA_TYPES.MAMMOGRAM_IMAGING_AREA]: IMAGING_TYPES.MAMMOGRAM,
  [IMAGING_AREA_TYPES.MAMMOGRAM_SCREEN_IMAGING_AREA]: IMAGING_TYPES.MAMMOGRAM_SCREEN,
  [IMAGING_AREA_TYPES.MAMMOGRAM_DIAG_IMAGING_AREA]: IMAGING_TYPES.MAMMOGRAM_DIAG,
  [IMAGING_AREA_TYPES.ENDOSCOPY_IMAGING_AREA]: IMAGING_TYPES.ENDOSCOPY,
  [IMAGING_AREA_TYPES.FLUROSCOPY_IMAGING_AREA]: IMAGING_TYPES.FLUROSCOPY,
  [IMAGING_AREA_TYPES.ANGIOGRAM_IMAGING_AREA]: IMAGING_TYPES.ANGIOGRAM,
  [IMAGING_AREA_TYPES.COLONOSCOPY_IMAGING_AREA]: IMAGING_TYPES.COLONOSCOPY,
  [IMAGING_AREA_TYPES.VASCULAR_STUDY_IMAGING_AREA]: IMAGING_TYPES.VASCULAR_STUDY,
  [IMAGING_AREA_TYPES.STRESS_TEST_IMAGING_AREA]: IMAGING_TYPES.STRESS_TEST,
};

// These are the status groupings for the versions of imaging request table that filter by different statuses
// This object is used to store the grouping for filtering but also to generate a code from the statuses
export const IMAGING_TABLE_STATUS_GROUPINGS: {
  ACTIVE: string[];
  COMPLETED: string[];
} = {
  ACTIVE: [IMAGING_REQUEST_STATUS_TYPES.PENDING, IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS],
  COMPLETED: [IMAGING_REQUEST_STATUS_TYPES.COMPLETED],
};

// Here we create an object constant that contains the code and statuses for each version of the imaging request table
// This is used for tracking the search memory of each table and also containing the statuses to be filtered by
export interface ImagingTableVersion {
  memoryKey: string;
  statuses: string[];
}
export const IMAGING_TABLE_VERSIONS: { [key: string]: ImagingTableVersion } = Object.fromEntries(
  Object.keys(IMAGING_TABLE_STATUS_GROUPINGS).map(key => {
    const statuses =
      IMAGING_TABLE_STATUS_GROUPINGS[key as keyof typeof IMAGING_TABLE_STATUS_GROUPINGS];
    return [
      key,
      {
        memoryKey: statuses.join('-'),
        statuses,
      },
    ];
  }),
);

export const INVOICEABLE_IMAGING_REQUEST_STATUSES = [
  IMAGING_REQUEST_STATUS_TYPES.PENDING,
  IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS,
  IMAGING_REQUEST_STATUS_TYPES.COMPLETED,
];
