import { QueryTypes } from 'sequelize';
import { arrayToDbString, renameObjectKeys } from 'shared/utils';
import { DIAGNOSIS_CERTAINTY, ENCOUNTER_TYPES } from '@tamanu/constants';
import { getWhereClausesAndReplacementsFromFilters, makeFilter } from '../../utils/query';
import { createPatientFilters } from '../../utils/patientFilters';

const sortKeys = {
  displayId: 'patients.display_id',
  lastName: 'UPPER(patients.last_name)',
  firstName: 'UPPER(patients.first_name)',
  age: 'patients.date_of_birth',
  dateOfBirth: 'patients.date_of_birth',
  villageName: 'village_name',
  sex: 'patients.sex',
};

const COVID_19_VIRUS_IDENTIFIED = 'icd10-U07-1';
const COVID_19_VIRUS_NOT_IDENTIFIED = 'icd10-U07-2';
const COVID_19_DIAGNOSES = [COVID_19_VIRUS_IDENTIFIED, COVID_19_VIRUS_NOT_IDENTIFIED];
const DIAGNOSIS_CERTAINTIES_TO_HIDE = [DIAGNOSIS_CERTAINTY.DISPROVEN, DIAGNOSIS_CERTAINTY.ERROR];
const SURVEY_ID = 'program-fijicovid19-fijicovidpatientsurvey';
const CLINICAL_STATUS_DATA_ELEMENT_ID = 'pde-COVClinicalStatus';

export const activeCovid19PatientsHandler = async (req, res) => {
  const { models, db, query } = req;

  req.checkPermission('list', 'Patient');

  const { Patient } = models;
  const { orderBy = 'lastName', order = 'asc', ...filterParams } = query;
  const sortKey = sortKeys[orderBy] || sortKeys.displayId;
  const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const filters = createPatientFilters(filterParams);
  const clinicalStatusFilter = makeFilter(
    filterParams.clinicalStatus,
    `UPPER(latest_clinical_status_survey.clinical_status) LIKE UPPER(:clinicalStatus)`,
    ({ clinicalStatus }) => ({ clinicalStatus: `${clinicalStatus}%` }),
  );
  if (clinicalStatusFilter) {
    filters.push(clinicalStatusFilter);
  }
  const {
    whereClauses: patientFilterWhereClauses,
    filterReplacements,
  } = getWhereClausesAndReplacementsFromFilters(filters, {
    ...filterParams,
    deletionStatus: null,
  });

  const result = await db.query(
    `
    SELECT
      patients.*,
      village.name AS village_name,
      encounters.start_date AS admission_start_date,
      latest_clinical_status_survey.last_survey_date AS last_survey_date,
      latest_clinical_status_survey.clinical_status AS clinical_status
    FROM patients


    --- Selecting current encounter and patients info
    LEFT JOIN (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY start_date DESC, id DESC) AS row_num
      FROM encounters
      WHERE end_date IS NULL
      AND deletion_status = :deletionStatus
      ) encounters
      ON (patients.id = encounters.patient_id AND encounters.row_num = 1)
    LEFT JOIN reference_data AS village
      ON patients.village_id = village.id



    --- Selecting latest clinical status survey response answer for each patient
    LEFT JOIN (
      SELECT 
      survey_responses.end_time AS last_survey_date,
      survey_response_answers.body AS clinical_status,
      patients.id as patient_id
      FROM patients
      LEFT JOIN (
        SELECT patient_id, max(end_time) AS most_recent_survey_response_date
        FROM survey_responses
        LEFT JOIN encounters 
  		    ON encounters.id = survey_responses.encounter_id
        WHERE survey_id = '${SURVEY_ID}'
          AND encounters.deletion_status = :deletionStatus
        GROUP BY patient_id
      ) AS recent_survey_response_by_patient
        ON patients.id = recent_survey_response_by_patient.patient_id
      LEFT JOIN encounters AS survey_response_encounters
        ON survey_response_encounters.patient_id = recent_survey_response_by_patient.patient_id
      INNER JOIN survey_responses
        ON (survey_response_encounters.id = survey_responses.encounter_id
          AND recent_survey_response_by_patient.most_recent_survey_response_date = survey_responses.end_time
          AND survey_id = '${SURVEY_ID}' )
      LEFT JOIN survey_response_answers
        ON (survey_responses.id = survey_response_answers.response_id 
          AND survey_response_answers.data_element_id = '${CLINICAL_STATUS_DATA_ELEMENT_ID}')) AS latest_clinical_status_survey
      ON latest_clinical_status_survey.patient_id = patients.id
      

    --- Selecting inpatients and correct COVID-19 diagnoses
    WHERE EXISTS(SELECT id FROM encounter_diagnoses
                  WHERE encounter_id = encounters.id
                  AND diagnosis_id IN (${arrayToDbString(COVID_19_DIAGNOSES)})
                  AND certainty NOT IN (${arrayToDbString(DIAGNOSIS_CERTAINTIES_TO_HIDE)}))
      AND encounters.encounter_type = '${ENCOUNTER_TYPES.ADMISSION}'
      ${patientFilterWhereClauses && `AND ${patientFilterWhereClauses}`}


    ORDER BY ${sortKey} ${sortDirection}
      `,
    {
      model: Patient,
      type: QueryTypes.SELECT,
      mapToModel: true,
      replacements: filterReplacements,
    },
  );

  const forResponse = result.map(x => renameObjectKeys(x.forResponse()));

  res.send({
    data: forResponse,
    count: result.length,
  });
};
