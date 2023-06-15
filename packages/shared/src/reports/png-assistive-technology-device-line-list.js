import { dataGenerator as baseDataGenerator } from './base-assistive-technology-device-line-list';

const ADD_MOBILITY_PRODUCT_SURVEY_ID =
  'program-pngassistivetechnologyproject-pngaddmobilityproduct';
const SELF_CARE_PRODUCT_SURVEY_ID = 'program-pngassistivetechnologyproject-pngaddselfcareproduct';
const ADD_VISION_PRODUCT_SURVEY_ID = 'program-pngassistivetechnologyproject-pngaddvisionproduct';
const REFER_TO_ANOTHER_SERVICE_SURVEY_ID =
  'program-pngassistivetechnologyproject-pngrefertoanotherservice';
const REGISTRATION_FORM_SURVEY_ID = 'program-pngassistivetechnologyproject-pngregistrationform';

const SURVEY_IDS = [
  ADD_MOBILITY_PRODUCT_SURVEY_ID,
  SELF_CARE_PRODUCT_SURVEY_ID,
  ADD_VISION_PRODUCT_SURVEY_ID,
  REFER_TO_ANOTHER_SERVICE_SURVEY_ID,
  REGISTRATION_FORM_SURVEY_ID,
];

const SURVEY_DATA_ELEMENT_IDS_LATEST_PER_PATIENT = {
  serviceProvider: 'pde-PNGMAReg-2',
  dateOfRegistration: 'pde-PNGMAReg-5',
  location: 'pde-PNGMAReg-12',
  difficultyWithMobility: 'pde-PNGMAReg-13',
};

const SURVEY_DATA_ELEMENT_IDS_LATEST_PER_PATIENT_PER_DATE = {
  mobilityProductServiceProvider: 'pde-PNGPreMob-3',
  dateOfProvision1: 'pde-PNGPreMob-1',
  walkingStick: 'pde-PNGPreMob-5',
  underarmCrutches: 'pde-PNGPreMob-6',
  forearmCrutches: 'pde-PNGPreMob-7',
  walkingFrameSize: 'pde-PNGPreMob-8',
  rollator: 'pde-PNGPreMob-9',
  selfCareProductServiceProvider: 'pde-PNGPreMob-3',
  dateOfProvision2: 'pde-PNGPreSC-1',
  toiletChair: 'pde-PNGPreSC-5',
  showerChair: 'pde-PNGPreSC-6',
  washableContinenceProducts: 'pde-PNGPreSC-7',
  allInOneMediumVolume600ml: 'pde-PNGPreSC-8',
  allInOneMediumVolume600mlQuantity: 'pde-PNGPreSC-9',
  allInOneHeavyVolume1000ml: 'pde-PNGPreSC-10',
  allInOneHeavyVolume1000mlQuantity: 'pde-PNGPreSC-11',
  shapedTerryTowellingPant: 'pde-PNGPreSC-12',
  shapedTerryTowellingPantQuantity: 'pde-PNGPreSC-13',
  terryTowellingSquare: 'pde-PNGPreSC-14',
  terryTowellingSquareQuantity: 'pde-PNGPreSC-15',
  waterProofPantPullUp: 'pde-PNGPreSC-16',
  waterProofPantPullUpQuantity: 'pde-PNGPreSC-17',
  waterProofPant: 'pde-PNGPreSC-18',
  waterProofPantQuantity: 'pde-PNGPreSC-19',
  boosters300Ml: 'pde-PNGPreSC-20',
  boosters300MlQuantity: 'pde-PNGPreSC-21',
  visionProductServiceProvider: 'pde-PNGPreVis-3',
  dateOfProvision3: 'pde-PNGPreVis-1',
  readingGlasses: 'pde-PNGPreVis-5',
  frameType: 'pde-PNGPreVis-6',
  otherFrameType: 'pde-PNGPreVis-7',
  handHeldMagnifier: 'pde-PNGPreVis-8',
  pocketMagnifier: 'pde-PNGPreVis-9',
  domeMagnifier: 'pde-PNGPreVis-10',
  standMagnifier: 'pde-PNGPreVis-11',
  barMagnifier: 'pde-PNGPreVis-12',
  sheetMagnifier: 'pde-PNGPreVis-13',
  neckMagnifier: 'pde-PNGPreVis-14',
  telescope: 'pde-PNGPreVis-15',
  dateOfReferral: 'pde-PNGRef-5',
  healthCareReferrals: 'pde-PNGRef-1',
  otherHealthCareReferrals: 'pde-PNGRef-2',
  otherServiceReferrals: 'pde-PNGRef-3',
  otherService: 'pde-PNGRef-4',
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
  { title: 'Location (Urban/Rural)', accessor: data => data.location },
  { title: 'Service provider (organization)', accessor: data => data.serviceProvider },
  { title: 'Date of registration', accessor: data => data.dateOfRegistration },
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
    title: 'Underarm (axilla) crutches',
    accessor: data => data.underarmCrutches,
  },
  {
    title: 'Forearm (elbow) crutches (adjustable)',
    accessor: data => data.forearmCrutches,
  },
  { title: 'Walking frame (without wheels) size', accessor: data => data.walkingFrameSize },
  { title: 'Rollator', accessor: data => data.rollator },
  {
    title: 'Self-care product service provider (organization)',
    accessor: data => data.selfCareProductServiceProvider,
  },
  { title: 'Date of provision', accessor: data => data.dateOfProvision1 },
  { title: 'Toilet chair', accessor: data => data.toiletChair },
  {
    title: 'Shower chair',
    accessor: data => data.showerChair,
  },
  { title: 'Washable Continence Products', accessor: data => data.washableContinenceProducts },
  { title: 'All in one (Medium volume, 600ml)', accessor: data => data.allInOneMediumVolume600ml },
  {
    title: 'All in one (Medium volume, 600ml) quantity',
    accessor: data => data.allInOneMediumVolume600mlQuantity,
  },
  { title: 'All in one (Heavy volume, 1,000ml)', accessor: data => data.allInOneHeavyVolume1000ml },
  {
    title: 'All in one (Heavy volume, 1,000ml) quantity',
    accessor: data => data.allInOneHeavyVolume1000mlQuantity,
  },
  { title: 'Shaped terry towelling pant', accessor: data => data.shapedTerryTowellingPant },
  {
    title: 'Shaped terry towelling pant quantity',
    accessor: data => data.shapedTerryTowellingPantQuantity,
  },
  { title: 'Terry towelling square', accessor: data => data.terryTowellingSquare },
  { title: 'Terry towelling square quantity', accessor: data => data.terryTowellingSquareQuantity },
  {
    title: 'Waterproof pant (pull up)',
    accessor: data => data.waterProofPantPullUp,
  },
  {
    title: 'Waterproof pant (pull up) quantity',
    accessor: data => data.waterProofPantPullUpQuantity,
  },
  { title: 'Waterproof pant', accessor: data => data.waterProofPant },
  { title: 'Waterproof pant quantity', accessor: data => data.waterProofPantQuantity },
  {
    title: 'Booster pad (300ml)',
    accessor: data => data.boosters300Ml,
  },
  { title: 'Booster pad (300ml) quantity', accessor: data => data.boosters300MlQuantity },
  {
    title: 'Vision product service provider (organization)',
    accessor: data => data.visionProductServiceProvider,
  },
  { title: 'Date of provision', accessor: data => data.dateOfProvision3 },
  { title: 'Reading glasses (strength)', accessor: data => data.readingGlasses },
  { title: 'Frame type', accessor: data => data.frameType },
  { title: 'Other frame type', accessor: data => data.otherFrameType },
  { title: 'Hand-held magnifier', accessor: data => data.handHeldMagnifier },
  { title: 'Pocket magnifier', accessor: data => data.pocketMagnifier },
  { title: 'Dome magnifier (non illuminated)', accessor: data => data.domeMagnifier },
  { title: 'Stand magnifier', accessor: data => data.standMagnifier },
  { title: 'Bar magnifier', accessor: data => data.barMagnifier },
  { title: 'Sheet magnifier with adjustable stand', accessor: data => data.sheetMagnifier },
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
    SURVEY_DATA_ELEMENT_IDS_LATEST_PER_PATIENT,
    SURVEY_DATA_ELEMENT_IDS_LATEST_PER_PATIENT_PER_DATE,
    REPORT_COLUMN_TEMPLATE,
  );

export const permission = 'SurveyResponse';
