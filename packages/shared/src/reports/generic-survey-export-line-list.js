import { endOfDay, parseISO, startOfDay, subDays } from 'date-fns';
import { keyBy } from 'lodash';
import {
  NON_ANSWERABLE_DATA_ELEMENT_TYPES,
  PROGRAM_DATA_ELEMENT_TYPES,
  DELETION_STATUSES,
} from '@tamanu/constants';
import { toDateTimeString } from '../utils/dateTime';
import {
  generateReportFromQueryData,
  getAnswerBody,
  getAutocompleteComponentMap,
} from './utilities';

const COMMON_FIELDS = [
  'Patient ID',
  'First name',
  'Last name',
  'Date of birth',
  'Age',
  'Sex',
  'Village',
  'Submission Time',
];

// Uncomment deleted_at checks once Tan-1421 is complete, see https://linear.app/bes/issue/TAN-1456/update-existing-sql-reports-to-support-deleted-at
const query = `
with
	answers_and_results as (
		select
			response_id,
			data_element_id,
			body
		from survey_response_answers sra
		union all
		select
			id,
			'Result',
			result_text
		from survey_responses sr
	),
	responses_with_answers as (
		select
			response_id,
			json_object_agg(
				data_element_id, body
			) "answers"
		from answers_and_results aar
		where body <> '' -- Doesn't really matter, just could save some memory
		--and aar.deleted_at is null
		and data_element_id is not null
		group by response_id
	)
select
  p.first_name "First name",
  p.last_name "Last name",
  p.date_of_birth::date "Date of birth",
  extract(year from age(p.date_of_birth::date))::integer "Age",
  p.sex "Sex",
  p.display_id "Patient ID", 
  vil."name" as "Village",
  to_char(sr.end_time::timestamp, 'YYYY-MM-DD HH12' || CHR(58) || 'MI AM') "Submission Time", -- Need to use "|| CHR(58)" here or else sequelize thinks "<colon>MI" is a variable (it even replaces in comments!!)
  s.name,
  answers
from survey_responses sr
left join responses_with_answers a on sr.id = a.response_id
left join encounters e on e.id = sr.encounter_id
left join patients p on p.id = e.patient_id
left join reference_data vil on vil.id = p.village_id
join surveys s on s.id = sr.survey_id
where sr.survey_id  = :survey_id
and CASE WHEN :village_id IS NOT NULL THEN p.village_id = :village_id ELSE true end
and CASE WHEN :from_date IS NOT NULL THEN sr.end_time::date >= :from_date::date ELSE true END
and CASE WHEN :to_date IS NOT NULL THEN sr.end_time::date <= :to_date::date ELSE true END
and e.deletion_status = :deletionStatus
order by sr.end_time desc
--and sr.deleted_at is null
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
  const { surveyId, fromDate, toDate, village } = parameters;

  const queryFromDate = toDateTimeString(
    startOfDay(fromDate ? parseISO(fromDate) : subDays(new Date(), 30)),
  );
  const queryToDate = toDate && toDateTimeString(endOfDay(parseISO(toDate)));

  return sequelize.query(query, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      survey_id: surveyId,
      from_date: queryFromDate ?? null,
      to_date: queryToDate ?? null,
      village_id: village ?? null,
      deletionStatus: DELETION_STATUSES.CURRENT,
    },
  });
};

const getReportColumnTemplate = components => {
  const answerableComponents = components.filter(
    ({ dataElement }) =>
      !NON_ANSWERABLE_DATA_ELEMENT_TYPES.includes(dataElement.type) &&
      dataElement.type !== PROGRAM_DATA_ELEMENT_TYPES.SURVEY_LINK,
  );
  const surveyHasResult = components.some(
    ({ dataElement }) => dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.RESULT,
  );

  return [
    ...COMMON_FIELDS.map(field => ({
      title: field,
      accessor: data => data[field],
    })),
    ...answerableComponents.map(({ dataElement }) => ({
      title: dataElement.name,
      accessor: data => data.answers[dataElement.id],
    })),
    ...(surveyHasResult ? [{ title: 'Result', accessor: data => data.answers.Result }] : []),
  ];
};

export const transformSingleResponse = async (
  models,
  result,
  autocompleteComponentMap,
  dataElementIdToComponent,
) => {
  const answers = result.answers || {};
  const newAnswers = {};

  await Promise.all(
    Object.entries(answers).map(async ([key, body]) => {
      if (key === 'Result') {
        newAnswers[key] = body;
      } else {
        const dataElementId = key;
        const type =
          dataElementIdToComponent[dataElementId]?.dataElement?.dataValues?.type || 'unknown';
        const componentConfig = autocompleteComponentMap.get(dataElementId);
        newAnswers[key] = await getAnswerBody(models, componentConfig, type, body, {
          dateFormat: 'yyyy-MM-dd',
        });
      }
    }),
  );

  return {
    ...result,
    answers: newAnswers,
  };
};

export const transformAllResponses = async (models, results, surveyComponents) => {
  const autocompleteComponentMap = getAutocompleteComponentMap(surveyComponents);
  const dataElementIdToComponent = keyBy(surveyComponents, component => component.dataElementId);

  const transformedResults = [];
  // Transforming results synchronously in order to avoid using too much memory
  for (const result of results) {
    const transformedResult = await transformSingleResponse(
      models,
      result,
      autocompleteComponentMap,
      dataElementIdToComponent,
    );
    transformedResults.push(transformedResult);
  }
  return transformedResults;
};

export const dataGenerator = async ({ sequelize, models }, parameters = {}) => {
  const { surveyId } = parameters;
  if (!surveyId) {
    throw new Error('parameter "survey" must be supplied');
  }
  const { isSensitive } = await models.Survey.findByPk(surveyId);
  if (isSensitive) {
    throw new Error('Cannot export a survey marked as "sensitive"');
  }

  const components = await models.SurveyScreenComponent.getComponentsForSurvey(surveyId, {
    includeAllVitals: true,
  });
  const reportColumnTemplate = getReportColumnTemplate(components);

  const rawData = await getData(sequelize, parameters);
  const results = await transformAllResponses(models, rawData, components);

  return generateReportFromQueryData(results, reportColumnTemplate);
};
