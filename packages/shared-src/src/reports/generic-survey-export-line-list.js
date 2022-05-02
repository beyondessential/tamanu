import { generateReportFromQueryData } from './utilities';

const PATIENT_FIELDS = ['Patient ID', 'First name', 'Last name', 'Date of birth', 'Age', 'Sex'];

const query = `
with 
  responses_with_answers as (
    select
      response_id,
      json_object_agg(
        data_element_id, body
      ) "answers"
    from survey_response_answers sra
    where body <> '' -- Doesn't really matter, just could save some memory
    and sra.deleted_at is null
    and data_element_id is not null
    group by response_id 
  )
select
  p.first_name "First name",
  p.last_name "Last name",
  to_char(p.date_of_birth::date, 'yyyy-mm-dd') "Date of birth",
  extract(year from age(p.date_of_birth)) "Age",
  p.sex "Sex",
  p.display_id "Patient ID",
  rd.name as village,
  to_char(sr.end_time::date, 'yyyy-mm-dd') endtime,
  s.name,
  answers
from survey_responses sr
left join responses_with_answers a on sr.id = a.response_id 
left join encounters e on e.id = sr.encounter_id
left join patients p on p.id = e.patient_id
left join reference_data rd on rd.id = p.village_id
join surveys s on s.id = sr.survey_id
where sr.survey_id  = :survey_id 
and sr.deleted_at is null
`;

/**
 * Results are returned from the sql query 1 row per survey response (e.g):
 *
 * {
 *   'First name': 'Healey',
 *   'Last name': 'Aislinna',
 *   ...,
 *   answers: {
 *     <data_element_id>: <answer body>,
 *     'pde-FijCOVSamp54': 'Melbourne Clinic',
 *     ...,
 *   }
 * },
 */
const getData = async (sequelize, parameters) => {
  const { surveyId, fromDate, toDate, patientBillingType, department, location } = parameters;

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      survey_id: surveyId,
      from_date: fromDate ?? null,
      to_date: toDate ?? null,
      billing_type: patientBillingType ?? null,
      department_id: department ?? null,
      location_id: location ?? null,
    },
  });
};

export const dataGenerator = async ({ sequelize, models }, parameters = {}) => {
  if (!parameters.surveyId) throw new Error('parameter "surveyId" must be supplied');

  const results = await getData(sequelize, parameters);

  const components = await models.SurveyScreenComponent.getAnswerComponentsForSurveys(surveyId);

  const reportColumnTemplate = [
    ...PATIENT_FIELDS.map(field => ({
      title: field,
      accessor: data => data[field],
    })),
    ...components.map(({ dataElement }) => ({
      title: dataElement.name,
      accessor: data => data.answers[dataElement.id],
    })),
  ];
  return generateReportFromQueryData(results, reportColumnTemplate);
};

export const permission = 'Encounter';
