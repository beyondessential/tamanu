import { dataGenerator as baseDataGenerator } from './base-assistive-technology-device-line-list';

const ADD_MOBILITY_PRODUCT_SURVEY_ID =
  'program-indiaassistivetechnologyproject-indiaaddmobilityproduct';
const SELF_CARE_PRODUCT_SURVEY_ID =
  'program-indiaassistivetechnologyproject-indiaaddselfcareproduct';
const ADD_VISION_PRODUCT_SURVEY_ID =
  'program-indiaassistivetechnologyproject-indiaaddvisionproduct';
const REFER_TO_ANOTHER_SERVICE_SURVEY_ID =
  'program-indiaassistivetechnologyproject-indiarefertoanotherservice';
const REGISTRATION_FORM_SURVEY_ID = 'program-indiaassistivetechnologyproject-indiaregistrationform';

const SURVEY_IDS = [
  ADD_MOBILITY_PRODUCT_SURVEY_ID,
  SELF_CARE_PRODUCT_SURVEY_ID,
  ADD_VISION_PRODUCT_SURVEY_ID,
  REFER_TO_ANOTHER_SERVICE_SURVEY_ID,
  REGISTRATION_FORM_SURVEY_ID,
];

const SURVEY_DATE_ELEMENT_IDS_LATEST_PER_PATIENT = {
  serviceProvider: 'pde-IndMAReg-2',
  dateOfRegistration: 'pde-IndMAReg-4',
  location: 'pde-IndMAReg-20',
  difficultyWithMobility: 'pde-IndMAReg-21',
};

const SURVEY_DATA_ELEMENT_IDS_LATEST_PER_PATIENT_PER_DATE = {
  mobilityProductServiceProvider: 'pde-IndPreMob-2',
  dateOfProvision1: 'pde-IndPreMob-1',
  walkingStick: 'pde-IndPreMob-14',
  elbowCrutches: 'pde-IndPreMob-6',
  axillaCrutches: 'pde-IndPreMob-7',
  walkingFrame: 'pde-IndPreMob-8',
  rollator: 'pde-IndPreMob-9',
  therapeuticFootwear: 'pde-IndPreMob-10',
  therapeuticFootwearSize: 'pde-IndPreMob-11',
  otherAssistiveProduct: 'pde-IndPreMob-15',
  selfCareProductServiceProvider: 'pde-IndPreSC-2',
  dateOfProvision2: 'pde-IndPreSC-1',
  toiletChair: 'pde-IndPreSC-6',
  showerChair: 'pde-IndPreSC-7',
  washableContinenceProducts: 'pde-IndPreSC-8',
  allIn600Ml: 'pde-IndPreSC-9',
  allIn600MlQuantity: 'pde-IndPreSC-10',
  allIn1000Ml: 'pde-IndPreSC-11',
  allIn1000MlQuantity: 'pde-IndPreSC-12',
  shapedTerryTowellingPant: 'pde-IndPreSC-13',
  shapedTerryTowellingPantQuantity: 'pde-IndPreSC-14',
  terryTowellingSquare: 'pde-IndPreSC-15',
  terryTowellingSquareQuantity: 'pde-IndPreSC-16',
  waterProofPantPullUp: 'pde-IndPreSC-17',
  waterProofPantPullUpQuantity: 'pde-IndPreSC-18',
  waterProofPant: 'pde-IndPreSC-19',
  waterProofPantQuantity: 'pde-IndPreSC-20',
  boosters300Ml: 'pde-IndPreSC-21',
  boosters300MlQuantity: 'pde-IndPreSC-22',
  visionProductServiceProvider: 'pde-IndPreVis-2',
  dateOfProvision3: 'pde-IndPreVis-1',
  readingGlasses: 'pde-IndPreVis-6',
  frameType: 'pde-IndPreVis-7',
  otherFrameType: 'pde-IndPreVis-8',
  handHeldMagnifier: 'pde-IndPreVis-9',
  illuminatedHandHeldMagnifier: 'pde-IndPreVis-10',
  pocketMagnifier: 'pde-IndPreVis-11',
  domeMagnifier: 'pde-IndPreVis-12',
  neckMagnifier: 'pde-IndPreVis-13',
  telescope: 'pde-IndPreVis-14',
  dateOfReferral: 'pde-IndRef-5',
  healthCareReferrals: 'pde-IndRef-1',
  otherHealthCareReferrals: 'pde-IndRef-2',
  otherServiceReferrals: 'pde-IndRef-3',
  otherService: 'pde-IndRef-4',
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
  { title: 'Service provider (organization)', accessor: data => data.serviceProvider },
  { title: 'Date of registration', accessor: data => data.dateOfRegistration },
  { title: 'Location (Urban/Rural)', accessor: data => data.location },
  {
    title: 'Difficulty with mobility/seeing/hearing etc',
    accessor: data => data.difficultyWithMobility,
  },
  {
    title: 'Mobility product service provider (organization)',
    accessor: data => data.mobilityProductServiceProvider,
  },
  { title: 'Date of provision', accessor: data => data.dateOfProvision1 },

  { title: 'Walking stick (adjustable)', accessor: data => data.walkingStick },
  {
    title: 'Elbow crutches (adjustable)',
    accessor: data => data.elbowCrutches,
  },
  {
    title: 'Axilla crutches',
    accessor: data => data.axillaCrutches,
  },
  { title: 'Walking frame (without wheels)', accessor: data => data.walkingFrame },
  { title: 'Rollator', accessor: data => data.rollator },
  { title: 'Therapeutic footwear', accessor: data => data.therapeuticFootwear },
  { title: 'Therapeutic footwear size', accessor: data => data.therapeuticFootwearSize },
  { title: 'Other assistive product', accessor: data => data.otherAssistiveProduct },
  {
    title: 'Self-care product service provider (organization)',
    accessor: data => data.selfCareProductServiceProvider,
  },
  { title: 'Date of provision', accessor: data => data.dateOfProvision2 },
  { title: 'Toilet chair', accessor: data => data.toiletChair },
  { title: 'Shower chair', accessor: data => data.showerChair },
  { title: 'Washable Continence Products', accessor: data => data.washableContinenceProducts },
  { title: 'All in one 600ml', accessor: data => data.allIn600Ml },
  { title: 'All in one 600ml quantity', accessor: data => data.allIn600MlQuantity },
  { title: 'All in one 1,000ml', accessor: data => data.allIn1000Ml },
  { title: 'All in one 1,000ml quantity', accessor: data => data.allIn1000MlQuantity },
  { title: 'Shaped terry towelling pant', accessor: data => data.shapedTerryTowellingPant },
  {
    title: 'Shaped terry towelling pant quantity',
    accessor: data => data.shapedTerryTowellingPantQuantity,
  },
  { title: 'Terry towelling square', accessor: data => data.terryTowellingSquare },
  { title: 'Terry towelling square quantity', accessor: data => data.terryTowellingSquareQuantity },
  { title: 'Waterproof pant (pull up)', accessor: data => data.waterProofPantPullUp },
  {
    title: 'Waterproof pant (pull up) quantity',
    accessor: data => data.waterProofPantPullUpQuantity,
  },
  { title: 'Waterproof pant', accessor: data => data.waterProofPant },
  { title: 'Waterproof pant quantity', accessor: data => data.waterProofPantQuantity },
  { title: 'Boosters 300ml', accessor: data => data.boosters300Ml },
  { title: 'Boosters 300ml quantity', accessor: data => data.boosters300MlQuantity },
  {
    title: 'Vision product service provider (organization)',
    accessor: data => data.visionProductServiceProvider,
  },
  { title: 'Date of provision', accessor: data => data.dateOfProvision3 },
  { title: 'Reading glasses (strength)', accessor: data => data.readingGlasses },
  { title: 'Frame type', accessor: data => data.frameType },
  { title: 'Other frame type', accessor: data => data.otherFrameType },
  { title: 'Hand-held magnifier', accessor: data => data.handHeldMagnifier },
  { title: 'Illuminated hand-held magnifier', accessor: data => data.illuminatedHandHeldMagnifier },
  { title: 'Pocket magnifier', accessor: data => data.pocketMagnifier },
  { title: 'Dome magnifier (non illuminated)', accessor: data => data.domeMagnifier },
  {
    title: 'Neck magnifier (non illuminated)',
    accessor: data => data.neckMagnifier,
  },
  {
    title: 'Telescope',
    accessor: data => data.telescope,
  },
  { title: 'Date of referral', accessor: data => data.dateOfReferral },
  { title: 'Health care referrals', accessor: data => data.healthCareReferrals },
  { title: 'Other health care referrals', accessor: data => data.otherHealthCareReferrals },
  { title: 'Other service referrals', accessor: data => data.otherServiceReferrals },
  { title: 'Other, other service referrals', accessor: data => data.otherService },
];

export const dataGenerator = async (store, parameters = {}) =>
  baseDataGenerator(
    store,
    parameters,
    SURVEY_IDS,
    SURVEY_DATE_ELEMENT_IDS_LATEST_PER_PATIENT,
    SURVEY_DATA_ELEMENT_IDS_LATEST_PER_PATIENT_PER_DATE,
    REPORT_COLUMN_TEMPLATE,
  );

export const permission = 'SurveyResponse';
