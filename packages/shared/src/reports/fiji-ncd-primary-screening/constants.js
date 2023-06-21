const CVD_PRIMARY_FORM_SURVEY_ID = 'program-fijincdprimaryscreening-fijicvdprimaryscreen2';
const CVD_PRIMARY_REFERRAL_SURVEY_ID = 'program-fijincdprimaryscreening-fijicvdprimaryscreenref';
export const BREAST_CANCER_FORM_SURVEY_ID =
  'program-fijincdprimaryscreening-fijibreastprimaryscreen';
const BREAST_CANCER_REFERRAL_SURVEY_ID = 'program-fijincdprimaryscreening-fijibreastscreenref';
const CERVICAL_CANCER_FORM_SURVEY_ID = 'program-fijincdprimaryscreening-fijicervicalprimaryscreen';
const CERVICAL_CANCER_REFERRAL_SURVEY_ID = 'program-fijincdprimaryscreening-fijicervicalscreenref';

export const PRIMARY_SCREENING_REPORT_COLUMN_TEMPLATE = [
  { title: 'First name', accessor: data => data.firstName },
  { title: 'Last name', accessor: data => data.lastName },
  { title: 'Patient ID', accessor: data => data.displayId },
  { title: 'Age', accessor: data => data.age },
  { title: 'Gender', accessor: data => data.gender },
  { title: 'Ethnicity', accessor: data => data.ethnicity },
  { title: 'Contact number', accessor: data => data.contactNumber },
  { title: 'Subdivison', accessor: data => data.village },
  { title: 'Medical area', accessor: data => data.medicalArea },
  { title: 'Nursing zone', accessor: data => data.nursingZone },
  { title: 'Screening completed', accessor: data => data.screeningCompleted },
  { title: 'Date of screening', accessor: data => data.dateOfScreening },
  { title: 'Screening location', accessor: data => data.screeningLocation },
  { title: 'Screening health facility', accessor: data => data.screeningHealthFacility },
  { title: 'Screening CSO', accessor: data => data.nameOfCso },
  { title: 'Screening eligibility', accessor: data => data.screeningEligibility },
  { title: 'CVD risk level', accessor: data => data.cvdRiskLevel },
  { title: 'Breast cancer risk level', accessor: data => data.breastCancerRiskLevel },
  { title: 'Referral created', accessor: data => data.referralCreated },
  { title: 'Date of referral', accessor: data => data.dateOfReferral },
  { title: 'Referred to health facility', accessor: data => data.referredToHealthFacility },
  { title: 'Expected attendance date', accessor: data => data.expectedAttendanceDate },
  { title: 'Referral status', accessor: data => data.referralStatus },
];

export const PRIMARY_SCREENING_PENDING_REFERRALS_REPORT_COLUMN_TEMPLATE = [
  { title: 'First name', accessor: data => data.firstName },
  { title: 'Last name', accessor: data => data.lastName },
  { title: 'Patient ID', accessor: data => data.displayId },
  { title: 'Age', accessor: data => data.age },
  { title: 'Gender', accessor: data => data.gender },
  { title: 'Ethnicity', accessor: data => data.ethnicity },
  { title: 'Contact number', accessor: data => data.contactNumber },
  { title: 'Subdivison', accessor: data => data.village },
  { title: 'Medical area', accessor: data => data.medicalArea },
  { title: 'Nursing zone', accessor: data => data.nursingZone },
  { title: 'Referral created', accessor: data => data.referralCreated },
  { title: 'Referring health facility', accessor: data => data.referringHealthFacility },
  { title: 'Referring CSO', accessor: data => data.referringCso },
  { title: 'Date of referral', accessor: data => data.dateOfReferral },
  { title: 'Expected attendance date', accessor: data => data.expectedAttendanceDate },
  { title: 'Reason for referral', accessor: data => data.reasonForReferral },
  { title: 'Date of screening', accessor: data => data.dateOfScreening },
  { title: 'Screening location', accessor: data => data.screeningLocation },
  { title: 'Screening health facility', accessor: data => data.screeningHealthFacility },
  { title: 'Screening CSO', accessor: data => data.nameOfCso },
  { title: 'CVD risk level', accessor: data => data.cvdRiskLevel },
  { title: 'Breast cancer risk level', accessor: data => data.breastCancerRiskLevel },
];

export const CVD_SURVEY_IDS = [CVD_PRIMARY_FORM_SURVEY_ID, CVD_PRIMARY_REFERRAL_SURVEY_ID];
export const BREAST_CANCER_SURVEY_IDS = [
  BREAST_CANCER_FORM_SURVEY_ID,
  BREAST_CANCER_REFERRAL_SURVEY_ID,
];
export const CERVICAL_CANCER_SURVEY_IDS = [
  CERVICAL_CANCER_FORM_SURVEY_ID,
  CERVICAL_CANCER_REFERRAL_SURVEY_ID,
];

export const CVD_SURVEY_GROUP_KEY = 'CVD';
export const BREAST_CANCER_SURVEY_GROUP_KEY = 'Breast_Cancer';
export const CERVICAL_CANCER_SURVEY_GROUP_KEY = 'Cervical';

export const ALL_SURVEY_IDS = [
  CVD_PRIMARY_FORM_SURVEY_ID,
  CVD_PRIMARY_REFERRAL_SURVEY_ID,
  BREAST_CANCER_FORM_SURVEY_ID,
  BREAST_CANCER_REFERRAL_SURVEY_ID,
  CERVICAL_CANCER_FORM_SURVEY_ID,
  CERVICAL_CANCER_REFERRAL_SURVEY_ID,
];

export const FORM_SURVEY_IDS = [
  CVD_PRIMARY_FORM_SURVEY_ID,
  BREAST_CANCER_FORM_SURVEY_ID,
  CERVICAL_CANCER_FORM_SURVEY_ID,
];

export const REFERRAL_SURVEY_IDS = [
  CVD_PRIMARY_REFERRAL_SURVEY_ID,
  BREAST_CANCER_REFERRAL_SURVEY_ID,
  CERVICAL_CANCER_REFERRAL_SURVEY_ID,
];

export const FORM_NAME_BY_SURVEY_GROUP_KEY = {
  [CVD_SURVEY_GROUP_KEY]: 'CVD Primary Screening',
  [BREAST_CANCER_SURVEY_GROUP_KEY]: 'Breast Cancer Primary Screening',
  [CERVICAL_CANCER_SURVEY_GROUP_KEY]: 'Cervical Cancer Primary Screening',
};

export const REFERRAL_NAME_BY_SURVEY_GROUP_KEY = {
  [CVD_SURVEY_GROUP_KEY]: 'CVD Primary Screening Referral',
  [BREAST_CANCER_SURVEY_GROUP_KEY]: 'Breast Cancer Primary Screening Referral',
  [CERVICAL_CANCER_SURVEY_GROUP_KEY]: 'Cervical Cancer Primary Screening Referral',
};

export const getSurveyResultDataElement = surveyId => `${surveyId}|$result`;

export const CVD_PRIMARY_SCREENING_FORM_DATA_ELEMENT_IDS = {
  dateOfScreening: 'pde-FijCVD002', // from Form survey
  screeningLocation: 'pde-FijCVD004', // from Form survey
  screeningHealthFacility: 'pde-FijCVD007', // from Form survey
  nameOfCso: 'pde-FijCVD010', // from Form survey
  screeningEligibility: 'pde-FijCVD021', // from Form survey
  cvdRiskLevel: getSurveyResultDataElement(CVD_PRIMARY_FORM_SURVEY_ID), // from Form survey
};

export const CVD_PRIMARY_SCREENING_REFERRAL_DATA_ELEMENT_IDS = {
  dateOfReferral: 'pde-FijCVDRef4', // from Referral survey
  referredToHealthFacility: 'pde-FijCVDRef6', // from Referral survey
  expectedAttendanceDate: 'pde-FijCVDRef7', // from Referral survey
  referringCso: 'pde-FijCVDRef2a', // from Referral survey
  reasonForReferral: 'pde-FijCVDRef11', // from Referral survey
  referringHealthFacility: 'pde-FijCVDRef2', // from Referral survey
};

export const BREAST_CANCER_PRIMARY_SCREENING_FORM_DATA_ELEMENT_IDS = {
  dateOfScreening: 'pde-FijBS02', // from Form survey
  screeningLocation: 'pde-FijBS04', // from Form survey
  screeningHealthFacility: 'pde-FijBS07', // from Form survey
  nameOfCso: 'pde-FijBS10', // from Form survey
  screeningEligibility: 'pde-FijBS14', // from Form survey
  breastCancerRiskLevel: getSurveyResultDataElement(BREAST_CANCER_FORM_SURVEY_ID), // from Form survey
};

export const BREAST_CANCER_PRIMARY_SCREENING_REFERRAL_DATA_ELEMENT_IDS = {
  dateOfReferral: 'pde-FijBCRef04', // from Referral survey
  referredToHealthFacility: 'pde-FijBCRef06', // from Referral survey
  expectedAttendanceDate: 'pde-FijBCRef07', // from Referral survey
  referringCso: 'pde-FijBCRef2a', // from Referral survey
  reasonForReferral: 'pde-FijBCRef10', // from Referral survey
  referringHealthFacility: 'pde-FijBCRef02', // from Referral survey
};

export const CERVICAL_CANCER_PRIMARY_SCREENING_FORM_DATA_ELEMENT_IDS = {
  dateOfScreening: 'pde-FijCC02', // from Form survey
  screeningLocation: 'pde-FijCC04', // from Form survey
  screeningHealthFacility: 'pde-FijCC07', // from Form survey
  nameOfCso: 'pde-FijCC10', // from Form survey
  screeningEligibility: 'pde-FijCC16', // from Form survey
};

export const CERVICAL_CANCER_PRIMARY_SCREENING_REFERRAL_DATA_ELEMENT_IDS = {
  dateOfReferral: 'pde-FijCCRef04', // from Referral survey
  referredToHealthFacility: 'pde-FijCCRef06', // from Referral survey
  expectedAttendanceDate: 'pde-FijCCRef07', // from Referral survey
  referringCso: 'pde-FijCCRef2a', // from Referral survey
  reasonForReferral: 'pde-FijCCRef10', // from Referral survey
  referringHealthFacility: 'pde-FijCCRef02', // from Referral survey
};
