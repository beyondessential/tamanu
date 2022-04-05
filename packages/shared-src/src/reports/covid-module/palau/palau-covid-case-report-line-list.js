import { keyBy, groupBy } from 'lodash';
import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from '../utilities';
import { transformAnswers } from '../utilities/transformAnswers';

const INITIAL_SURVEY_ID = 'program-palaucovid19-palaucovidinitialcasereportform';
const FOLLOW_UP_SURVEY_ID = 'program-palaucovid19-palaucovidfollowupcasereport';

/**
 * SQL Snippet from interim report
 * source https://linear.app/bes/issue/TAN-1324/create-palau-covid-19-case-report-line-list-report
select
	p.first_name,
	p.last_name,
	to_char(p.date_of_birth::date, 'yyyy-mm-dd') as dob,
	p.sex,
	p.display_id as patient_id,
	rd.name as hamlet,
	rd1.name as nationality,
	max(case when sra.data_element_id = 'pde-PalauCOVCase1' then sra.body end) as case_investigator,
	max(case when sra.data_element_id = 'pde-PalauCOVCase2' then sra.body end) as name,
	max(case when sra.data_element_id = 'pde-PalauCOVCase3' then to_char(sra.body::date, 'yyyy-mm-dd') end) as case_report_date,
	max(case when sra.data_element_id = 'pde-PalauCOVCase4' then to_char(sra.body::date, 'yyyy-mm-dd') end) as interview_date,
	max(case when sra.data_element_id = 'pde-PalauCOVCase5' then sra.body end) as case_identification,
	max(case when sra.data_element_id = 'pde-PalauCOVCase6' then sra.body end) as passport_number,
	max(case when sra.data_element_id = 'pde-PalauCOVCase7' then sra.body end) as phone_number,
	max(case when sra.data_element_id = 'pde-PalauCOVCase8' then sra.body end) as current_street_address,
	max(case when sra.data_element_id = 'pde-PalauCOVCase9' then sra.body end) as city_hamlet,
	max(case when sra.data_element_id = 'pde-PalauCOVCase10' then sra.body end) as healthcare_worker,
	max(case when sra.data_element_id = 'pde-PalauCOVCase11' then sra.body end) as facility,
	max(case when sra.data_element_id = 'pde-PalauCOVCase13' then sra.body end) as full_name_respondant,
	max(case when sra.data_element_id = 'pde-PalauCOVCase14' then sra.body end) as relationship_to_case_respondant,
	max(case when sra.data_element_id = 'pde-PalauCOVCase16' then sra.body end) as hospitalization_required,
	max(case when sra.data_element_id = 'pde-PalauCOVCase18' then sra.body end) as vaccination_status,
	max(case when sra.data_element_id = 'pde-PalauCOVCase20' then to_char(sra.body::date, 'yyyy-mm-dd') end) as booster_date,
	max(case when sra.data_element_id = 'pde-PalauCOVCase27' then sra.body end) as exposed_out_of_Palau_in_last_14_days,
	max(case when sra.data_element_id = 'pde-PalauCOVCase28' then sra.body end) as date_of_arrival_in_Palau,
	max(case when sra.data_element_id = 'pde-PalauCOVCase31' then sra.body end) as risk_factors,
	max(case when sra.data_element_id = 'pde-PalauCOVCase30' then sra.body end) as patient_may_be_high_risk,
	max(case when sra.data_element_id = 'pde-PalauCOVCase32' then sra.body end) as laboratory_testing,
	max(case when sra.data_element_id = 'pde-PalauCOVCase33' then to_char(sra.body::date, 'yyyy-mm-dd') end) as day_0_sample_collected,
	max(case when sra.data_element_id = 'pde-PalauCOVCase36' then sra.body end) as patient_symptomatic,
	max(case when sra.data_element_id = 'pde-PalauCOVCaseFUp02' then to_char(sra.body::date, 'yyyy-mm-dd') end) as follow_up_sample_collected,
	max(case when sra.data_element_id = 'pde-PalauCOVCaseFUp04' then sra.body end) as symptomatic,
	max(case when sra.data_element_id = 'pde-PalauCOVCaseFUp06' then sra.body end) as patient_outcome,
	max(case when sra.data_element_id = 'pde-PalauCOVCaseFUp07' then to_char(sra.body::date, 'yyyy-mm-dd') end) as date_symptoms_resolved,
	max(case when sra.data_element_id = 'pde-PalauCOVCaseFUp08' then to_char(sra.body::date, 'yyyy-mm-dd') end) as date_of_death
from survey_response_answers sra 
left join survey_responses sr on sr.id = sra.response_id 
left join encounters e on e.id = sr.encounter_id
left join patients p on p.id = e.patient_id
left join patient_additional_data pad2 on pad2.patient_id = p.id
left join reference_data rd on rd.id = p.village_id
left join reference_data rd1 on rd1.id = pad2.nationality_id
where sra.data_element_id like 'pde-PalauCOVCase%' and p.display_id != 'QCJL976947'
group by sr.encounter_id, p.first_name, p.last_name, p.date_of_birth, p.sex, p.display_id, hamlet, nationality
 */

const INITIAL_SURVEY_QUESTION_CODES = {
  caseInvestigatorName: 'pde-PalauCOVCase2',
  caseReportDate: 'pde-PalauCOVCase3',
  interviewDate: 'pde-PalauCOVCase4',
  passportNumber: 'pde-PalauCOVCase6',
  phoneNumber: 'pde-PalauCOVCase7',
  currentStreetAddress: 'pde-PalauCOVCase8',
  cityHamletReferenceId: 'pde-PalauCOVCase9', // used as is in SQL snippet
  isHealthcareWorker: 'pde-PalauCOVCase10',
  healthcareWorkerFacilityReferenceId: 'pde-PalauCOVCase11', // used as is in SQL snippet
  respondentFullname: 'pde-PalauCOVCase13',
  respondentRelationship: 'pde-PalauCOVCase14',
  hospitalizationRequired: 'pde-PalauCOVCase16',
  vaccinationStatus: 'pde-PalauCOVCase18',
  boosterDate: 'pde-PalauCOVCase20',
  beenExposed: 'pde-PalauCOVCase27',
  palauArrivalDate: 'pde-PalauCOVCase28',
  riskFactors: 'pde-PalauCOVCase31',
  sampleCollectedDate: 'pde-PalauCOVCase33',
  isSymptomatic: 'pde-PalauCOVCase36',
};
const FOLLOW_UP_SURVEY_CODES = {
  followUpSampleDate: 'pde-PalauCOVCaseFUp02',
  followUpIsSymptomatic: 'pde-PalauCOVCaseFUp04',
  followUpPatientOutcome: 'pde-PalauCOVCaseFUp06',
  followUpSymptomResolveDate: 'pde-PalauCOVCaseFUp07',
  followUpDeathDate: 'pde-PalauCOVCaseFUp08',
};

const reportColumnTemplate = [
  { title: 'Patient first name', accessor: data => data.firstName },
  { title: 'Patient last name', accessor: data => data.lastName },
  { title: 'DOB', accessor: data => data.dob },
  { title: 'Sex', accessor: data => data.sex },
  { title: 'Patient ID', accessor: data => data.patientId },
  { title: 'Hamlet', accessor: data => data.village },
  { title: 'Nationality', accessor: data => data.additionalDataNationality },

  // initial survey
  // instruction case investigator
  { title: 'Name', accessor: data => data.caseInvestigatorName },
  { title: 'Case report date', accessor: data => data.caseReportDate },
  { title: 'Interview date', accessor: data => data.interviewDate },
  // instruction case identification
  { title: 'Passport number', accessor: data => data.passportNumber },
  { title: 'Phone number', accessor: data => data.phoneNumber },
  { title: 'Current street address', accessor: data => data.currentStreetAddress },
  { title: 'City/Hamlet', accessor: data => data.cityHamletReferenceId },
  { title: 'Is the patient a healthcare worker?', accessor: data => data.isHealthcareWorker },
  {
    title: 'If yes, indicate facility',
    accessor: data => data.healthcareWorkerFacilityReferenceId,
  },
  { title: 'Full name (Respondant)', accessor: data => data.respondentFullname },
  { title: 'Relationship to case (Respondant)', accessor: data => data.respondentRelationship },
  {
    title: 'Hospitalization required for COVID-19',
    accessor: data => data.hospitalizationRequired,
  },
  { title: 'Vaccination status', accessor: data => data.vaccinationStatus },
  { title: 'Booster/third dose date', accessor: data => data.boosterDate },
  {
    title: 'Has the patient been exposed out of Palau in the last 14 days?',
    accessor: data => data.beenExposed,
  },
  { title: 'If yes, list date of arrival in Palau', accessor: data => data.palauArrivalDate },
  { title: 'Risk factors', accessor: data => data.riskFactors },
  // instruction high risk
  // instruction lab testing
  { title: 'Day 0 sample collected', accessor: data => data.sampleCollectedDate },
  { title: 'Is the patient symptomatic?', accessor: data => data.isSymptomatic },

  // follow up survey
  { title: 'Follow up sample collected', accessor: data => data.followUpSampleDate },
  { title: 'Symptomatic', accessor: data => data.followUpIsSymptomatic },
  { title: 'Patient outcome', accessor: data => data.followUpPatientOutcome },
  { title: 'Date symptoms resolved', accessor: data => data.followUpSymptomResolveDate },
  { title: 'Date of death', accessor: data => data.followUpDeathDate },
];

const yieldControl = () => new Promise(resolve => setTimeout(resolve, 20));

const parametersToSurveyResponseSqlWhere = (parameters, surveyId) => {
  const defaultWhereClause = {
    surveyId,
  };

  if (!parameters || !Object.keys(parameters).length) {
    return defaultWhereClause;
  }

  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce((where, [key, value]) => {
      const newWhere = { ...where };
      switch (key) {
        case 'village':
          newWhere['$encounter->patient.village_id$'] = value;
          break;
        default:
          break;
      }
      return newWhere;
    }, defaultWhereClause);

  return whereClause;
};

const getLatestSurveyResponsesForEachPatient = async (models, parameters, surveyId) => {
  return await models.SurveyResponse.findAll({
    where: parametersToSurveyResponseSqlWhere(parameters, surveyId),
    include: [
      {
        model: models.Encounter,
        as: 'encounter',
        include: [
          {
            model: models.Patient,
            as: 'patient',
          },
        ],
      },
    ],
    order: [['end_time', 'DESC']],
    // TODO: INCLUDE SURVEY_RESPONSE_ANSWERS
    // TODO: GROUP BY PATIENTS, ORDER BY end_time
    // TODO: LIMIT 1?
  });
};

export const dataGenerator = async ({ models }, parameters = {}) => {
  const reportData = {};

  // get initial survey responses grouped by patient
  // for each patient, sort surveys by date, get latest

  const initialSurveyResponses = await getLatestSurveyResponsesForEachPatient(
    models,
    parameters,
    INITIAL_SURVEY_ID,
  );

  // get followup survey responses grouped by patient
  // for each patient, sort surveys by date, get latest
  const followupSurveyResponses = await getLatestSurveyResponsesForEachPatient(
    models,
    parameters,
    FOLLOW_UP_SURVEY_ID,
  );

  // TODO: What if there are patients in follow up but not in initial?

  // Loop through each initial survey response, find a follow up response
  // print out on each line

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'SurveyResponse';
