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
  DDMMYY_HHMMSS: 'dd/MM/yyyy pp',
  DATE_AND_TIME_HHMMSS: 'dd MMM yyyy pp',
  DATE_AND_TIME_HHMM: 'dd MMM yyyy p',
  TIME_HHMMSS: 'pp',
  TIME: 'p',
} as const;

export const FilterTypeAll = 'All';

export const VisitTypes = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic',
  VISIT: 'Visit',
} as const;

export const PatientFromRoute = {
  HOME: 'home',
  RECENTLY_VIEWED: 'recentlyViewed',
  ALL_PATIENT: 'allPatient',
} as const;

export const HeaderIcons = {
  //TODO: find correct icons for each EncounterType
  [EncounterType.Clinic]: Icons.ClipboardIcon,
  [EncounterType.Emergency]: Icons.FirstAidKitIcon,
  [EncounterType.Admission]: Icons.StethoscopeIcon,
  [EncounterType.Imaging]: Icons.FirstAidKitIcon,
  [EncounterType.Observation]: Icons.FirstAidKitIcon,
  [EncounterType.Triage]: Icons.FirstAidKitIcon,
  [EncounterType.SurveyResponse]: Icons.FirstAidKitIcon,
} as const;

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
] as const;

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
} as const;

export const Gender = {
  Male: 'male',
  Female: 'female',
  Other: 'other',
} as const;

export const MaleGender = {
  label: 'Male',
  value: Gender.Male,
} as const;

export const OtherGender = {
  label: 'Other',
  value: Gender.Other,
} as const;

export const FemaleGender = {
  label: 'Female',
  value: Gender.Female,
} as const;

export const GenderOptions = [MaleGender, FemaleGender, OtherGender] as const;

export const EncounterTypeNames = {
  admission: 'Admission',
  clinic: 'Clinic',
  imaging: 'Imaging',
  emergency: 'Emergency',
  observation: 'Observation',
  triage: 'Triage',
  surveyResponse: 'Form response',
  vaccination: 'Vaccination record',
} as const;

export const LabRequestStatus = {
  reception_pending: 'Reception pending',
  results_pending: 'Results pending',
  interim_results: 'Interim results',
  to_be_verified: 'To be verified',
  verified: 'Verified',
  published: 'published',
} as const;

export const VitalsDataElements = {
  dateRecorded: 'pde-PatientVitalsDate',
} as const;

export const NOTE_RECORD_TYPES = {
  ENCOUNTER: 'Encounter',
  PATIENT: 'Patient',
  TRIAGE: 'Triage',
  PATIENT_CARE_PLAN: 'PatientCarePlan',
  LAB_REQUEST: 'LabRequest',
  IMAGING_REQUEST: 'ImagingRequest',
  // IMPORTANT: if you add any more record types, you must also alter buildNoteLinkedSyncFilter
} as const;

export const NOTE_TYPES = {
  TREATMENT_PLAN: 'notetype-treatmentPlan',
  DISCHARGE: 'notetype-discharge',
  AREA_TO_BE_IMAGED: 'notetype-areaToBeImaged',
  RESULT_DESCRIPTION: 'notetype-resultDescription',
  SYSTEM: 'notetype-system',
  OTHER: 'notetype-other',
  CLINICAL_MOBILE: 'notetype-clinicalMobile',
  HANDOVER: 'notetype-handover',
} as const;
