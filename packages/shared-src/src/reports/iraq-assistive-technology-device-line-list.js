import { dataGenerator as baseDataGenerator } from './base-assistive-technology-device-line-list';

const ADD_MOBILITY_PRODUCT_SURVEY_ID = 'program-assistivetechnologyproject-iraqaddmobilityproduct';
const REFER_TO_ANOTHER_SERVICE_SURVEY_ID =
  'program-assistivetechnologyproject-iraqrefertoanotherservice';
const REGISTRATION_FORM_SURVEY_ID = 'program-assistivetechnologyproject-iraqregistrationform';

const SURVEY_IDS = [
  ADD_MOBILITY_PRODUCT_SURVEY_ID,
  REFER_TO_ANOTHER_SERVICE_SURVEY_ID,
  REGISTRATION_FORM_SURVEY_ID,
];

const SURVEY_DATA_ELEMENT_IDS_LATEST_PER_PATIENT = {
  phccProvider: 'pde-IrqMAReg-3',
  difficultyWithMobility: 'pde-IrqMAReg-13',
};

const SURVEY_DATA_ELEMENT_IDS_LATEST_PER_PATIENT_PER_DATE = {
  provider: 'pde-IrqPreMob-2',
  dateOfProvision1: 'pde-IrqPreMob-1',
  quadStick: 'pde-IrqPreMob-6',
  walkingStick: 'pde-IrqPreMob-7',
  elbowCrutches: 'pde-IrqPreMob-8',
  axillaCrutches: 'pde-IrqPreMob-9',
  walkingFrame: 'pde-IrqPreMob-10',
  rubberTips: 'pde-IrqPreMob-11',
  dateOfReferral: 'pde-IrqRef-5',
  healthCareReferrals: 'pde-IrqRef-1',
  otherHealthCareReferrals: 'pde-IrqRef-2',
  otherServiceReferrals: 'pde-IrqRef-3',
  otherService: 'pde-IrqRef-4',
};

const REPORT_COLUMN_TEMPLATE = [
  {
    title: 'Client ID',
    accessor: data => data.clientId,
  },
  {
    title: 'Gender',
    accessor: data => data.gender,
  },
  {
    title: 'Date of Birth',
    accessor: data => data.dateOfBirth,
  },
  { title: 'Age', accessor: data => data.age },
  { title: 'PHCC provider (مزود الرعاية الصحية الأولية)', accessor: data => data.phccProvider },
  {
    title: 'Difficulty with mobility/seeing/hearing etc (هل لديك صعوبة مع)',
    accessor: data => data.difficultyWithMobility,
  },

  {
    title: 'Provider ( المزود)',
    accessor: data => data.provider,
  },
  {
    title: 'Date of provision (تم تقديم التاريخ)',
    accessor: data => data.dateOfProvision1,
  },
  { title: 'Quad stick (عكاز عصا رباعية)', accessor: data => data.quadStick },

  { title: 'Walking stick (عصا المشي)', accessor: data => data.walkingStick },
  {
    title: 'Elbow crutches (عكازات الكوع)',
    accessor: data => data.elbowCrutches,
  },
  {
    title: 'Axillary crutches (pair)',
    accessor: data => data.axillaCrutches,
  },
  {
    title: 'Walking frame (without wheels) (إطار المشي (بدون عجلات) - مشاية)',
    accessor: data => data.walkingFrame,
  },
  { title: 'Rubber tips (أطراف مطاطية)', accessor: data => data.rubberTips },
  { title: 'Date of referral (تاريخ الإحالة)', accessor: data => data.dateOfReferral },
  { title: 'Health care referrals (الرعاىة الصحية)', accessor: data => data.healthCareReferrals },
  {
    title: 'Other health care referrals (ان كان هنالك إجابات أخرى  اوصف ذلك)',
    accessor: data => data.otherHealthCareReferrals,
  },
  {
    title: 'Other service referrals (خدمة أخرى)',
    accessor: data => data.otherServiceReferrals,
  },
  {
    title: 'Other, other service referrals (ان كان هنالك إجابات أخرى  اوصف ذلك)',
    accessor: data => data.otherService,
  },
];

export const dataGenerator = async (store, parameters = {}) =>
  baseDataGenerator(
    store,
    parameters,
    SURVEY_IDS,
    SURVEY_DATA_ELEMENT_IDS_LATEST_PER_PATIENT,
    SURVEY_DATA_ELEMENT_IDS_LATEST_PER_PATIENT_PER_DATE,
    REPORT_COLUMN_TEMPLATE,
  );

export const permission = 'SurveyResponse';
