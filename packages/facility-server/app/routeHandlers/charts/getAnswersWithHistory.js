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
    FROM survey_response_answers sra
      INNER JOIN survey_responses sr ON sr.id = sra.response_id
      ${patientId ? 'INNER JOIN encounters e ON e.id = sr.encounter_id' : ''}
      LEFT JOIN vital_logs vl ON vl.answer_id = sra.id
      LEFT JOIN users u ON u.id = vl.recorded_by_id
    WHERE ${encounterId ? 'sr.encounter_id = :encounterId' : 'e.patient_id = :patientId AND e.deleted_at IS NULL'}
      AND sr.deleted_at IS NULL
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
    FROM survey_response_answers sra
      INNER JOIN survey_responses sr ON sr.id = sra.response_id
      ${patientId ? 'INNER JOIN encounters e ON e.id = sr.encounter_id' : ''}
      LEFT JOIN logs.changes lc ON lc.record_id = sra.id
      LEFT JOIN users u ON u.id = lc.updated_by_user_id
    WHERE ${encounterId ? 'sr.encounter_id = :encounterId' : 'e.patient_id = :patientId AND e.deleted_at IS NULL'}
      AND sr.deleted_at IS NULL
      AND lc.table_name = 'survey_response_answers'
    GROUP BY lc.record_id
  `;

  const result = await db.query(
    `
      WITH
      date AS (
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
        ORDER BY sra.body ${order} LIMIT :limit OFFSET :offset
      ),
      history AS (
        ${isVitals ? vitalsHistorySelect : chartHistorySelect}
      )

      SELECT
        JSONB_BUILD_OBJECT(
          'dataElementId', answer.data_element_id,
          'records', JSONB_OBJECT_AGG(date.body, JSONB_BUILD_OBJECT('id', answer.id, 'body', answer.body, 'logs', history.logs))
        ) result
      FROM
        survey_response_answers answer
      INNER JOIN
        date
      ON date.response_id = answer.response_id
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
