const PROGRAM_ID = 'program-fijincdprimaryscreening';
const CVD_PRIMARY_FORM_SURVEY_ID = 'program-fijincdprimaryscreening-fijicvdprimaryscreen2';
const CVD_PRIMARY_REFERRAL_SURVEY_ID = 'program-fijincdprimaryscreening-fijicvdprimaryscreenref';
const BREAST_CANCER_FORM_SURVEY_ID = 'program-fijincdprimaryscreening-fijibreastprimaryscreen';
const BREAST_CANCER_REFERRAL_SURVEY_ID = 'program-fijincdprimaryscreening-fijibreastscreenref';
const CERVICAL_CANCER_FORM_SURVEY_ID = 'program-fijincdprimaryscreening-fijicervicalprimaryscreen';
const CERVICAL_CANCER_REFERRAL_SURVEY_ID = 'program-fijincdprimaryscreening-fijicervicalscreenref';

const SNAP_FORM_SURVEY_ID = 'program-fijincdprimaryscreening-fijisnapassessform';

export const createCVDFormSurveyResponse = async (app, patient, surveyDate, overrides = {}) => {
  const { answerOverrides = {} } = overrides;
  await app.post('/v1/surveyResponse').send({
    surveyId: CVD_PRIMARY_FORM_SURVEY_ID,
    startTime: surveyDate,
    patientId: patient.id,
    endTime: surveyDate,
    resultText: '3% GREEN',
    answers: {
      'pde-FijCVD002': `pde-FijCVD002-on-${surveyDate}-${patient.firstName}`,
      'pde-FijCVD004': `pde-FijCVD004-on-${surveyDate}-${patient.firstName}`,
      'pde-FijCVD007': `pde-FijCVD007-on-${surveyDate}-${patient.firstName}`,
      'pde-FijCVD010': `pde-FijCVD010-on-${surveyDate}-${patient.firstName}`,
      'pde-FijCVD021': `pde-FijCVD021-on-${surveyDate}-${patient.firstName}`,
      ...answerOverrides,
    },
  });
};

export const createCVDReferral = async (app, patient, referralDate) => {
  await app.post('/v1/referral').send({
    surveyId: CVD_PRIMARY_REFERRAL_SURVEY_ID,
    startTime: referralDate,
    patientId: patient.id,
    endTime: referralDate,
    answers: {
      'pde-FijCVDRef4': `pde-FijCVDRef4-on-${referralDate}-${patient.firstName}`,
      'pde-FijCVDRef2a': `pde-FijCVDRef2a-on-${referralDate}-${patient.firstName}`,
      'pde-FijCVDRef6': `pde-FijCVDRef6-on-${referralDate}-${patient.firstName}`,
      'pde-FijCVDRef7': `pde-FijCVDRef7-on-${referralDate}-${patient.firstName}`,
      'pde-FijCVDRef11': `pde-FijCVDRef11-on-${referralDate}-${patient.firstName}`,
    },
  });
};

export const createBreastCancerFormSurveyResponse = async (
  app,
  patient,
  surveyDate,
  overrides = {},
) => {
  const { answerOverrides = {}, ...otherOverrides } = overrides;
  await app.post('/v1/surveyResponse').send({
    surveyId: BREAST_CANCER_FORM_SURVEY_ID,
    startTime: surveyDate,
    patientId: patient.id,
    endTime: surveyDate,
    resultText: 'High risk',
    answers: {
      'pde-FijBS02': `pde-FijBS02-on-${surveyDate}-${patient.firstName}`,
      'pde-FijBS04': `pde-FijBS04-on-${surveyDate}-${patient.firstName}`,
      'pde-FijBS07': `pde-FijBS07-on-${surveyDate}-${patient.firstName}`,
      'pde-FijBS10': `pde-FijBS10-on-${surveyDate}-${patient.firstName}`,
      'pde-FijBS14': `pde-FijBS14-on-${surveyDate}-${patient.firstName}`,
      ...answerOverrides,
    },
    ...otherOverrides,
  });
};

export const createBreastCancerReferral = async (app, patient, referralDate) => {
  await app.post('/v1/referral').send({
    surveyId: BREAST_CANCER_REFERRAL_SURVEY_ID,
    startTime: referralDate,
    patientId: patient.id,
    endTime: referralDate,
    answers: {
      'pde-FijBCRef04': `pde-FijBCRef04-on-${referralDate}-${patient.firstName}`,
      'pde-FijBCRef2a': `pde-FijBCRef2a-on-${referralDate}-${patient.firstName}`,
      'pde-FijBCRef06': `pde-FijBCRef06-on-${referralDate}-${patient.firstName}`,
      'pde-FijBCRef07': `pde-FijBCRef07-on-${referralDate}-${patient.firstName}`,
      'pde-FijBCRef10': `pde-FijBCRef10-on-${referralDate}-${patient.firstName}`,
    },
  });
};

export const createSNAPFormSurveyResponse = async (app, patient, surveyDate, overrides = {}) => {
  const { answerOverrides = {}, ...otherOverrides } = overrides;
  await app.post('/v1/surveyResponse').send({
    surveyId: SNAP_FORM_SURVEY_ID,
    startTime: surveyDate,
    patientId: patient.id,
    endTime: surveyDate,
    answers: answerOverrides,
    ...otherOverrides,
  });
};

export const setupProgramAndSurvey = async models => {
  await models.Program.create({
    id: PROGRAM_ID,
    name: 'Assistive Technology Project',
  });

  await models.ProgramDataElement.bulkCreate([
    { id: 'pde-FijCVD002', code: 'FijCVD002', name: 'FijCVD002', type: 'FreeText' },
    { id: 'pde-FijCVD004', code: 'FijCVD004', name: 'FijCVD004', type: 'FreeText' },
    { id: 'pde-FijCVD007', code: 'FijCVD007', name: 'FijCVD007', type: 'FreeText' },
    { id: 'pde-FijCVD010', code: 'FijCVD010', name: 'FijCVD010', type: 'FreeText' },
    { id: 'pde-FijCVD021', code: 'FijCVD021', name: 'FijCVD021', type: 'FreeText' },
    { id: 'pde-FijCVD038', code: 'FijCVD038', name: 'FijCVD038', type: 'FreeText' },
    { id: 'pde-FijCVDRisk334', code: 'FijCVDRisk334', name: 'FijCVDRisk334', type: 'FreeText' },

    { id: 'pde-FijCVDRef2a', code: 'FijCVDRef2a', name: 'FijCVDRef2a', type: 'FreeText' },
    { id: 'pde-FijCVDRef4', code: 'FijCVDRef4', name: 'FijCVDRef4', type: 'FreeText' },
    { id: 'pde-FijCVDRef6', code: 'FijCVDRef6', name: 'FijCVDRef6', type: 'FreeText' },
    { id: 'pde-FijCVDRef7', code: 'FijCVDRef7', name: 'FijCVDRef7', type: 'FreeText' },
    { id: 'pde-FijCVDRef11', code: 'FijCVDRef11', name: 'FijCVDRef11', type: 'FreeText' },

    { id: 'pde-FijBS02', code: 'FijBS02', name: 'FijBS02', type: 'FreeText' },
    { id: 'pde-FijBS04', code: 'FijBS04', name: 'FijBS04', type: 'FreeText' },
    { id: 'pde-FijBS07', code: 'FijBS07', name: 'FijBS07', type: 'FreeText' },
    { id: 'pde-FijBS10', code: 'FijBS10', name: 'FijBS10', type: 'FreeText' },
    { id: 'pde-FijBS14', code: 'FijBS14', name: 'FijBS14', type: 'FreeText' },

    { id: 'pde-FijBCRef2a', code: 'FijBCRef2a', name: 'FijBCRef2a', type: 'FreeText' },
    { id: 'pde-FijBCRef04', code: 'FijBCRef04', name: 'FijBCRef04', type: 'FreeText' },
    { id: 'pde-FijBCRef06', code: 'FijBCRef06', name: 'FijBCRef06', type: 'FreeText' },
    { id: 'pde-FijBCRef07', code: 'FijBCRef07', name: 'FijBCRef07', type: 'FreeText' },
    { id: 'pde-FijBCRef10', code: 'FijBCRef10', name: 'FijBCRef10', type: 'FreeText' },

    { id: 'pde-FijCC02', code: 'FijCC02', name: 'FijCC02', type: 'FreeText' },
    { id: 'pde-FijCC04', code: 'FijCC04', name: 'FijCC04', type: 'FreeText' },
    { id: 'pde-FijCC07', code: 'FijCC07', name: 'FijCC07', type: 'FreeText' },
    { id: 'pde-FijCC10', code: 'FijCC10', name: 'FijCC10', type: 'FreeText' },
    { id: 'pde-FijCC16', code: 'FijCC16', name: 'FijCC16', type: 'FreeText' },

    { id: 'pde-FijCCRef04', code: 'FijCCRef04', name: 'FijCCRef04', type: 'FreeText' },
    { id: 'pde-FijCCRef06', code: 'FijCCRef06', name: 'FijCCRef06', type: 'FreeText' },
    { id: 'pde-FijCCRef07', code: 'FijCCRef07', name: 'FijCCRef07', type: 'FreeText' },

    { id: 'pde-FijSNAP13', code: 'FijSNAP13', name: 'FijSNAP13', type: 'FreeText' },
  ]);

  await models.Survey.bulkCreate([
    {
      id: CVD_PRIMARY_FORM_SURVEY_ID,
      name: CVD_PRIMARY_FORM_SURVEY_ID,
      programId: PROGRAM_ID,
    },
    {
      id: CVD_PRIMARY_REFERRAL_SURVEY_ID,
      name: CVD_PRIMARY_REFERRAL_SURVEY_ID,
      programId: PROGRAM_ID,
    },
    {
      id: BREAST_CANCER_FORM_SURVEY_ID,
      name: BREAST_CANCER_FORM_SURVEY_ID,
      programId: PROGRAM_ID,
    },
    {
      id: BREAST_CANCER_REFERRAL_SURVEY_ID,
      name: BREAST_CANCER_REFERRAL_SURVEY_ID,
      programId: PROGRAM_ID,
    },
    {
      id: CERVICAL_CANCER_FORM_SURVEY_ID,
      name: CERVICAL_CANCER_FORM_SURVEY_ID,
      programId: PROGRAM_ID,
    },
    {
      id: CERVICAL_CANCER_REFERRAL_SURVEY_ID,
      name: CERVICAL_CANCER_REFERRAL_SURVEY_ID,
      programId: PROGRAM_ID,
    },
    {
      id: SNAP_FORM_SURVEY_ID,
      name: SNAP_FORM_SURVEY_ID,
      programId: PROGRAM_ID,
    },
  ]);

  await models.SurveyScreenComponent.bulkCreate([
    { dataElementId: 'pde-FijCVD002', surveyId: CVD_PRIMARY_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijCVD004', surveyId: CVD_PRIMARY_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijCVD007', surveyId: CVD_PRIMARY_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijCVD010', surveyId: CVD_PRIMARY_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijCVD021', surveyId: CVD_PRIMARY_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijCVD038', surveyId: CVD_PRIMARY_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijCVDRisk334', surveyId: CVD_PRIMARY_FORM_SURVEY_ID },

    { dataElementId: 'pde-FijCVDRef2a', surveyId: CVD_PRIMARY_REFERRAL_SURVEY_ID },
    { dataElementId: 'pde-FijCVDRef4', surveyId: CVD_PRIMARY_REFERRAL_SURVEY_ID },
    { dataElementId: 'pde-FijCVDRef6', surveyId: CVD_PRIMARY_REFERRAL_SURVEY_ID },
    { dataElementId: 'pde-FijCVDRef7', surveyId: CVD_PRIMARY_REFERRAL_SURVEY_ID },
    { dataElementId: 'pde-FijCVDRef11', surveyId: CVD_PRIMARY_REFERRAL_SURVEY_ID },

    { dataElementId: 'pde-FijBS02', surveyId: BREAST_CANCER_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijBS04', surveyId: BREAST_CANCER_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijBS07', surveyId: BREAST_CANCER_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijBS10', surveyId: BREAST_CANCER_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijBS14', surveyId: BREAST_CANCER_FORM_SURVEY_ID },

    { dataElementId: 'pde-FijBCRef2a', surveyId: BREAST_CANCER_REFERRAL_SURVEY_ID },
    { dataElementId: 'pde-FijBCRef04', surveyId: BREAST_CANCER_REFERRAL_SURVEY_ID },
    { dataElementId: 'pde-FijBCRef06', surveyId: BREAST_CANCER_REFERRAL_SURVEY_ID },
    { dataElementId: 'pde-FijBCRef07', surveyId: BREAST_CANCER_REFERRAL_SURVEY_ID },
    { dataElementId: 'pde-FijBCRef10', surveyId: BREAST_CANCER_REFERRAL_SURVEY_ID },

    { dataElementId: 'pde-FijCC02', surveyId: CERVICAL_CANCER_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijCC04', surveyId: CERVICAL_CANCER_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijCC07', surveyId: CERVICAL_CANCER_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijCC10', surveyId: CERVICAL_CANCER_FORM_SURVEY_ID },
    { dataElementId: 'pde-FijCC16', surveyId: CERVICAL_CANCER_FORM_SURVEY_ID },

    { dataElementId: 'pde-FijCCRef04', surveyId: CERVICAL_CANCER_REFERRAL_SURVEY_ID },
    { dataElementId: 'pde-FijCCRef06', surveyId: CERVICAL_CANCER_REFERRAL_SURVEY_ID },
    { dataElementId: 'pde-FijCCRef07', surveyId: CERVICAL_CANCER_REFERRAL_SURVEY_ID },

    { dataElementId: 'pde-FijSNAP13', surveyId: SNAP_FORM_SURVEY_ID },
  ]);
};
