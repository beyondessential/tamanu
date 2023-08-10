import { EncounterType } from '~/types';
import * as Icons from '/components/Icons';
import { theme } from '/styled/theme';
import { VaccineStatus } from '/helpers/patient';
import { ColorHelper } from './colors';

export const DateFormats = {
  short: 'EEE, dd MMM',
  DAY_MONTH_YEAR_SHORT: 'dd MMM yyyy',
  DAY_MONTH: 'dd MMM',
  DDMMYY: 'dd/MM/yyyy',
  SHORT_MONTH: 'MMM',
  DATE_AND_TIME: 'dd MMM yyyy pp',
  TIME_HHMMSS: 'pp',
  TIME: 'p',
};

export const FilterTypeAll = 'All';

export const VisitTypes = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic',
  VISIT: 'Visit',
};

export const HeaderIcons = {
  //TODO: find correct icons for each EncounterType
  [EncounterType.Clinic]: Icons.ClipboardIcon,
  [EncounterType.Emergency]: Icons.FirstAidKitIcon,
  [EncounterType.Admission]: Icons.StethoscopeIcon,
  [EncounterType.Imaging]: Icons.FirstAidKitIcon,
  [EncounterType.Observation]: Icons.FirstAidKitIcon,
  [EncounterType.Triage]: Icons.FirstAidKitIcon,
  [EncounterType.SurveyResponse]: Icons.FirstAidKitIcon,
};

export const PatientVitalsList = [
  'height',
  'weight',
  'temperature',
  'sbp',
  'dbp',
  'heartRate',
  'respiratoryRate',
  'sv02',
  'avpu',
];

const seniorDoctorRole = {
  value: 'senior-doctor',
  label: 'Senior Doctor',
};
const juniorDoctorRole = {
  value: 'junior-doctor',
  label: 'Junior Doctor',
};
const seniorNurse = {
  value: 'senior-nurse',
  label: 'Senior Nurse',
};
const juniorNurse = {
  value: 'junior-nurse',
  label: 'Junior Nurse',
};
const midWife = {
  value: 'midwife',
  label: 'Midwife',
};
const appliedHealth = {
  value: 'applied-health',
  label: 'Applied Health',
};
const finnanceRole = {
  value: 'finance',
  label: 'Finance',
};
const radiologyRole = {
  value: 'radiology',
  label: 'Radiology',
};
const labRole = {
  value: 'lab',
  label: 'Lab',
};
const practitionerRole = {
  value: 'practitioner',
  label: 'Practitioner',
};
export const userRolesOptions = [
  seniorDoctorRole,
  juniorDoctorRole,
  seniorNurse,
  juniorNurse,
  midWife,
  appliedHealth,
  finnanceRole,
  radiologyRole,
  labRole,
  practitionerRole,
];

type VaccineStatusCellsType = {
  [key in VaccineStatus]?: {
    Icon: (props: Record<string, any>) => React.ReactElement;
    background: string;
    color: string;
    text: string;
  };
};

export const VaccineStatusCells: VaccineStatusCellsType = {
  [VaccineStatus.UNKNOWN]: {
    Icon: Icons.EmptyCircleIcon,
    background: 'transparent',
    color: theme.colors.TEXT_SOFT,
    text: 'Unknown',
  },
  [VaccineStatus.GIVEN]: {
    Icon: Icons.GivenOnTimeIcon,
    background: theme.colors.SAFE,
    color: theme.colors.WHITE,
    text: 'Given',
  },
  [VaccineStatus.NOT_GIVEN]: {
    Icon: Icons.NotGivenIcon,
    background: theme.colors.DISABLED_GREY,
    color: theme.colors.WHITE,
    text: 'Not given',
  },
  [VaccineStatus.SCHEDULED]: {
    Icon: Icons.EmptyCircleIcon,
    background: theme.colors.BACKGROUND_GREY,
    color: theme.colors.TEXT_SOFT,
    text: 'Scheduled',
  },
  [VaccineStatus.MISSED]: {
    Icon: Icons.CrossIcon,
    background: theme.colors.ALERT,
    color: theme.colors.TEXT_SOFT,
    text: 'Missed',
  },
  [VaccineStatus.DUE]: {
    Icon: Icons.EmptyCircleIcon,
    background: theme.colors.PRIMARY_MAIN,
    color: theme.colors.TEXT_SOFT,
    text: 'Due now',
  },
  [VaccineStatus.OVERDUE]: {
    Icon: Icons.EmptyCircleIcon,
    background: theme.colors.SECONDARY_MAIN,
    color: theme.colors.TEXT_SOFT,
    text: 'Overdue',
  },
  [VaccineStatus.UPCOMING]: {
    Icon: Icons.EmptyCircleIcon,
    background: ColorHelper.halfTransparency(theme.colors.PRIMARY_MAIN),
    color: theme.colors.TEXT_SOFT,
    text: 'Upcoming',
  },
};

export const PhoneMask = { mask: '9999 9999 999' };

export const Gender = {
  Male: 'male',
  Female: 'female',
  Other: 'other',
};

export const MaleGender = {
  label: 'Male',
  value: Gender.Male,
};

export const OtherGender = {
  label: 'Other',
  value: Gender.Other,
};

export const FemaleGender = {
  label: 'Female',
  value: Gender.Female,
};

export const GenderOptions = [MaleGender, FemaleGender, OtherGender];

export const EncounterTypeNames = {
  admission: 'Admission',
  clinic: 'Clinic',
  imaging: 'Imaging',
  emergency: 'Emergency',
  observation: 'Observation',
  triage: 'Triage',
  surveyResponse: 'Survey response',
  vaccination: 'Vaccination record',
};

export const LabRequestStatus = {
  reception_pending: 'Reception pending',
  results_pending: 'Results pending',
  to_be_verified: 'To be verified',
  verified: 'Verified',
  published: 'published',
};

// also update /packages/lan/app/routes/apiv1/surveyResponse.js when this changes
export const AutocompleteSourceToColumnMap = {
  Department: 'name',
  Facility: 'name',
  Location: 'name',
  LocationGroup: 'name',
  ReferenceData: 'name',
  User: 'displayName',
};

export const VitalsDataElements = {
  dateRecorded: 'pde-PatientVitalsDate',
};

export const NOTE_RECORD_TYPES = {
  ENCOUNTER: 'Encounter',
  PATIENT: 'Patient',
  TRIAGE: 'Triage',
  PATIENT_CARE_PLAN: 'PatientCarePlan',
  LAB_REQUEST: 'LabRequest',
  IMAGING_REQUEST: 'ImagingRequest',
  // IMPORTANT: if you add any more record types, you must also alter buildNoteLinkedSyncFilter
};

export const NOTE_TYPES = {
  TREATMENT_PLAN: 'treatmentPlan',
  MEDICAL: 'medical',
  SURGICAL: 'surgical',
  NURSING: 'nursing',
  DIETARY: 'dietary',
  PHARMACY: 'pharmacy',
  PHYSIOTHERAPY: 'physiotherapy',
  SOCIAL: 'social',
  DISCHARGE: 'discharge',
  AREA_TO_BE_IMAGED: 'areaToBeImaged',
  RESULT_DESCRIPTION: 'resultDescription',
  SYSTEM: 'system',
  OTHER: 'other',
  CLINICAL_MOBILE: 'clinicalMobile',
  HANDOVER: 'handover',
};

export const FORM_STATUSES = {
  SUBMIT_SCREEN_ATTEMPTED: 'SUBMIT_SCREEN_ATTEMPTED',
};
