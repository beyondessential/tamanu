import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { subject } from '@casl/ability';
import { VITALS_DATA_ELEMENT_IDS, CHARTING_DATA_ELEMENT_IDS } from '@tamanu/constants';

// Route handler factory for getting survey response answers with edit history
export const fetchAnswersWithHistory = (options = {}) =>
  asyncHandler(async (req, res) => {
    const {
      permissionAction = 'read',
      permissionNoun = 'Charting',
    } = options;

    const { params } = req;
    const { id: encounterId, patientId, surveyId } = params;

    if (!encounterId && !patientId) {
      throw new Error('Either encounterId or patientId must be provided');
    }

    if (permissionNoun === 'Charting' && surveyId) {
      req.checkPermission(permissionAction, subject('Charting', { id: surveyId }));
    } else {
      req.checkPermission(permissionAction, permissionNoun);
    }

    const { count, data } = await getAnswersWithHistory(req, {
      encounterId,
      patientId,
      surveyId,
    });

    res.send({ count: parseInt(count, 10), data });
  });

// Used in charts and vitals to query responses based on the date of a response answer
async function getAnswersWithHistory(req, options = {}) {
  const { db, query } = req;
  const { encounterId = null, patientId = null, surveyId = null } = options;
  const { order = 'DESC', instanceId = null } = query;

  const isVitals = surveyId === null;
  const dateDataElement = isVitals
    ? VITALS_DATA_ELEMENT_IDS.dateRecorded
    : CHARTING_DATA_ELEMENT_IDS.dateRecorded;

  const encounterFilter = encounterId
    ? 'response.encounter_id = :encounterId'
    : 'e.patient_id = :patientId AND e.deleted_at IS NULL';

  // The LIMIT and OFFSET occur in an unusual place in this query
  // So we can't run it through the generic runPaginatedQuery function
  const countResult = await db.query(
    `
      SELECT COUNT(1) AS count
      FROM survey_response_answers sra
      INNER JOIN survey_responses response ON response.id = sra.response_id
      ${patientId ? 'INNER JOIN encounters e ON e.id = response.encounter_id' : ''}
      WHERE sra.data_element_id = :dateDataElement
      AND sra.body IS NOT NULL
      AND ${encounterFilter}
      AND response.deleted_at IS NULL
      AND CASE WHEN :surveyId IS NOT NULL THEN response.survey_id = :surveyId ELSE true END
      AND CASE WHEN :instanceId IS NOT NULL THEN response.metadata->>'chartInstanceResponseId' = :instanceId ELSE true END
    `,
    {
      replacements: {
        encounterId,
        patientId,
        dateDataElement,
        surveyId,
        instanceId,
      },
      type: QueryTypes.SELECT,
    },
  );

  const { count } = countResult[0];
  if (count === 0) {
    return { data: [], count: 0 };
  }

  const { page = 0, rowsPerPage = isVitals ? 10 : 50 } = query;

  // History is computed only over the answers on the requested page (page_answers),
  // not the whole encounter, and only for answers that actually have edit history.
  const vitalsHistorySelect = `
    SELECT
      vl.answer_id,
      ARRAY_AGG((
        JSONB_BUILD_OBJECT(
          'newValue', vl.new_value,
          'reasonForChange', vl.reason_for_change,
          'date', vl.date,
          'userDisplayName', u.display_name
        )
      )) logs
    FROM page_answers pa
      INNER JOIN vital_logs vl ON vl.answer_id = pa.id
      LEFT JOIN users u ON u.id = vl.recorded_by_id
    GROUP BY vl.answer_id
  `;

  const chartHistorySelect = `
    SELECT
      lc.record_id as answer_id,
      ARRAY_AGG((
        JSONB_BUILD_OBJECT(
          'newValue', lc.record_data->>'body',
          'reasonForChange', lc.reason,
          'date', TO_CHAR(lc.logged_at, 'YYYY-MM-DD HH24:MI:SS'),
          'userDisplayName', u.display_name
        )
      )) logs
    FROM page_answers pa
      INNER JOIN logs.changes lc ON lc.record_id = pa.id AND lc.table_name = 'survey_response_answers'
      LEFT JOIN users u ON u.id = lc.updated_by_user_id
    GROUP BY lc.record_id
  `;

  const result = await db.query(
    `
      WITH
      filtered AS MATERIALIZED (
        SELECT response.id as response_id, sra.body
        FROM survey_response_answers sra
        INNER JOIN survey_responses response ON response.id = sra.response_id
        ${patientId ? 'INNER JOIN encounters e ON e.id = response.encounter_id' : ''}
        WHERE sra.data_element_id = :dateDataElement
        AND sra.body IS NOT NULL
        AND ${encounterFilter}
        AND response.deleted_at IS NULL
        AND CASE WHEN :surveyId IS NOT NULL THEN response.survey_id = :surveyId ELSE true END
        AND CASE WHEN :instanceId IS NOT NULL THEN response.metadata->>'chartInstanceResponseId' = :instanceId ELSE true END
      ),
      date AS (
        SELECT response_id, body
        FROM filtered
        ORDER BY body ${order} LIMIT :limit OFFSET :offset
      ),
      page_answers AS MATERIALIZED (
        SELECT answer.id, answer.data_element_id, answer.body, date.body AS date_body
        FROM survey_response_answers answer
        INNER JOIN date ON date.response_id = answer.response_id
      ),
      history AS (
        ${isVitals ? vitalsHistorySelect : chartHistorySelect}
      )

      SELECT
        JSONB_BUILD_OBJECT(
          'dataElementId', answer.data_element_id,
          'records', JSONB_OBJECT_AGG(answer.date_body, JSONB_BUILD_OBJECT('id', answer.id, 'body', answer.body, 'logs', history.logs))
        ) result
      FROM
        page_answers answer
      LEFT JOIN
        history
      ON history.answer_id = answer.id
      GROUP BY answer.data_element_id
    `,
    {
      replacements: {
        encounterId,
        patientId,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        dateDataElement,
        surveyId,
        instanceId,
      },
      type: QueryTypes.SELECT,
    },
  );

  const data = result.map(r => r.result);
  return { count, data };
}
