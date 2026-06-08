/**
 * @typedef {import('@tamanu/database').ChangeLog} ChangeLog
 * @typedef {import('@tamanu/database').ProgramDataElement} ProgramDataElement
 * @typedef {import('@tamanu/database').SurveyResponseAnswer} SurveyResponseAnswer
 * @typedef {import('@tamanu/database').User} User
 * @typedef {{
 *   id: ChangeLog['id'];
 *   recordId: ChangeLog['recordId'];
 *   recordData: Pick<SurveyResponseAnswer, 'body' | 'editedTime' | 'id'>;
 *   programDataElement: Pick<ProgramDataElement, 'id' | 'name' | 'type'>;
 *   updatedByUser: Pick<User, 'id' | 'displayName'>;
 *   from: SurveyResponseAnswer['body'];
 *   to: SurveyResponseAnswer['body'];
 * }} Change
 * @typedef {Change & { _revision: number }} Revision
 * Revision numbers (`_revision`) are scoped to the updated record. i.e. The oldest row for a given
 * question of a survey is always assigned revision 0. Its first edit is revision 1, etc. Revision
 * numbers for another question also start at 0.
 * @typedef {Revision[]} RevisionHistory
 */
import asyncHandler from 'express-async-handler';
import { omit } from 'lodash';
import { QueryTypes } from 'sequelize';

import { PROGRAM_DATA_ELEMENT_TYPES, SURVEY_TYPES } from '@tamanu/constants';
import { InvalidOperationError, NotFoundError } from '@tamanu/errors';
import { decompressSignatureBody } from '@tamanu/shared/utils/signature';

/**
 * Prior vs current `survey_response_answers.body`, or `null` if unchanged / no current row.
 *
 * @param {SurveyResponseAnswer | undefined | null} prevRecordData
 * @param {SurveyResponseAnswer} currRecordData
 * @returns {{ from: SurveyResponseAnswer['body']; to: SurveyResponseAnswer['body'] } | null}
 */
function diffAnswerBody(prevRecordData, currRecordData) {
  const from = prevRecordData?.body ?? null;
  const to = currRecordData.body ?? null;
  return from === to ? null : { from, to };
}

export const surveyResponseChangesGetHandler = asyncHandler(async (req, res) => {
  const { models, params, db } = req;
  req.checkPermission('read', 'SurveyResponse');

  const surveyResponseRecord = await models.SurveyResponse.findByPk(params.id);
  if (!surveyResponseRecord) throw new NotFoundError('Survey response not found');

  const survey = await surveyResponseRecord.getSurvey();
  if (!survey) throw new NotFoundError('Associated survey not found');

  if (survey.surveyType !== SURVEY_TYPES.PROGRAMS) {
    throw new InvalidOperationError('Changelog is only available for program survey responses');
  }

  req.checkPermission('read', survey);

  /** @type {Change[]} */
  const rawRows = await db.query(
    `
      SELECT
        c.id,
        c.record_id AS "recordId",
        jsonb_build_object(
          'id', c.record_data->>'id',
          'body', c.record_data->>'body',
          'editedTime', c.record_data->>'edited_time'
        ) AS "recordData",
        jsonb_build_object(
          'id', pde.id,
          'name', pde.name,
          'type', pde.type
        ) AS "programDataElement",
        jsonb_build_object(
          'id', c.updated_by_user_id::text,
          'displayName', u.display_name
        ) AS "updatedByUser"
      FROM
        logs.changes c
        LEFT JOIN users u ON u.id = c.updated_by_user_id
        LEFT JOIN program_data_elements pde ON pde.id = (c.record_data ->> 'data_element_id')
      WHERE
        c.migration_context IS NULL
        AND c.table_name = 'survey_response_answers'
        AND (c.record_data ->> 'response_id') = :surveyResponseId
      ORDER BY
        c.created_at,
        c.id
    `,
    {
      replacements: { surveyResponseId: params.id },
      type: QueryTypes.SELECT,
    },
  );

  /** @type {Map<ChangeLog['recordId'], RevisionHistory>}*/
  const revisionHistoryById = new Map();
  /** @type {RevisionHistory} */
  const revisions = [];

  for (const row of rawRows) {
    const key = row.recordId;
    let history = revisionHistoryById.get(key);
    if (history === undefined) {
      history = [];
      revisionHistoryById.set(key, history);
    }
    const revision = { ...row, _revision: history.length };
    history.push(revision);
    revisions.push(revision);
  }

  const changes = (
    await Promise.all(
      revisions.map(async revision => {
        if (!revision.recordData.editedTime) return null; // Edits only, no creates

        const prevRevision = revisionHistoryById.get(revision.recordId)?.[revision._revision - 1];
        const diff = diffAnswerBody(prevRevision?.recordData, revision.recordData);

        if (!diff) return null; // No meaningful change (shouldn’t really happen)

        const isSignature =
          revision.programDataElement?.type === PROGRAM_DATA_ELEMENT_TYPES.SIGNATURE;
        const from = isSignature ? await decompressSignatureBody(diff.from) : diff.from;
        const to = isSignature ? await decompressSignatureBody(diff.to) : diff.to;

        // Done with revision number; omit from response
        return { ...omit(revision, '_revision'), from, to };
      }),
    )
  )
    .filter(change => change !== null)
    .reverse(); // Reverse chronological order (recent edits first)

  await req.audit.access({
    recordId: surveyResponseRecord.id,
    frontEndContext: { ...params, changelog: true },
    model: models.SurveyResponse,
    facilityId: req.query.facilityId,
  });

  res.send(changes);
});
