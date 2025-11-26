import Sequelize, { Op, QueryTypes } from 'sequelize';
import asyncHandler from 'express-async-handler';
import { NOTE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';

import { checkNotePermission } from '../../utils/checkNotePermission';

export const noteListHandler = recordType =>
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { order = 'ASC', orderBy, noteTypeId, rowsPerPage, page } = query;

    const recordId = params.id;
    await checkNotePermission(req, { recordType, recordId }, 'list');

    const include = [
      {
        model: models.User,
        as: 'author',
      },
      {
        model: models.User,
        as: 'onBehalfOf',
      },
      {
        model: models.ReferenceData,
        as: 'noteTypeReference',
      },
      {
        model: models.Note,
        as: 'revisedBy',
        required: false,
        attributes: ['date'],
        include: [
          {
            model: models.User,
            as: 'author',
          },
          {
            model: models.User,
            as: 'onBehalfOf',
          },
        ],
      },
    ];

    const idRows = await models.Note.sequelize.query(
      `
      WITH

      -- first create a sub-table with only the notes for this record.
      -- this will make the DISTINCT stuff way faster
      this_record_notes AS (
        SELECT
          *,
          CASE WHEN revised_by_id IS NULL THEN id ELSE revised_by_id END edit_chain
        FROM notes n
        WHERE record_type = :recordType
          AND record_id = :recordId
          AND deleted_at IS NULL
      )

      -- now filter out anything except the latest revision for each note
      SELECT DISTINCT ON (edit_chain)
        id
      FROM this_record_notes n
      ORDER BY edit_chain, date DESC
    `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          recordType,
          recordId,
        },
      },
    );

    // any other filtering should happen after the edits have been determined
    // (if we do it all in the same step, we risk including earlier versions of
    // a record that was excluded later, which we absolutely do not want)
    const where = {
      id: {
        [Op.in]: idRows.map(x => x.id),
      },
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      ...(noteTypeId ? { noteTypeId } : {}),
    };

    const queryOrder = orderBy
      ? [[orderBy, order.toUpperCase()]]
      : [
          [
            // Pin TREATMENT_PLAN on top
            Sequelize.literal(
              `case when "Note"."note_type_id" = '${NOTE_TYPES.TREATMENT_PLAN}' then 0 else 1 end`,
            ),
          ],
          [
            // If the note has already been revised then order by the root note's date.
            // If this is the root note then order by the date of this note
            Sequelize.literal(
              'case when "revisedBy"."date" notnull then "revisedBy"."date" else "Note"."date" end desc',
            ),
          ],
        ];

    const rows = await models.Note.findAll({
      include,
      where,
      order: queryOrder,
      limit: rowsPerPage,
      offset: page && rowsPerPage ? page * rowsPerPage : undefined,
    });
    const totalCount = await models.Note.count({
      where,
    });

    res.send({ data: rows, count: totalCount });
  });

export const notesWithSingleItemListHandler = recordType =>
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    const recordId = params.id;
    await checkNotePermission(req, { recordType, recordId }, 'list');

    const notes = await models.Note.findAll({
      include: [
        { model: models.User, as: 'author' },
        { model: models.User, as: 'onBehalfOf' },
        { model: models.ReferenceData, as: 'noteTypeReference' },
      ],
      where: {
        recordId,
        recordType,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      order: [['date', 'DESC']],
    });

    res.send({ data: notes, count: notes.length });
  });
