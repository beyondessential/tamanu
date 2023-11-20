import Sequelize, { Op } from 'sequelize';
import asyncHandler from 'express-async-handler';
import { NOTE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';

import { checkNotePermission } from '../../utils/checkNotePermission';

export const noteListHandler = recordType =>
  asyncHandler(async (req, res) => {
    const { db, models, params, query } = req;
    const { order = 'ASC', orderBy, noteType, rowsPerPage, page } = query;

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

    // All notes, filtered by recordId, recordType & visibilityStatus are loaded excluding:
    // 1- (1st notIn) Notes that have another more recent note with the same root (revisedById)
    // 2- (2nd notIn) Root notes that have been revised by another note
    const baseWhere = {
      id: {
        [Op.and]: [
          {
            [Op.notIn]: db.literal(`
              (
                SELECT id
                FROM (
                  SELECT id, revised_by_id, ROW_NUMBER() OVER (PARTITION BY revised_by_id ORDER BY date DESC, id DESC) AS row_num
                  FROM notes
                  WHERE revised_by_id IS NOT NULL
                ) n
                WHERE n.row_num != 1
              )
            `),
          },
          {
            [Op.notIn]: db.literal(`
              (
                SELECT revised_by_id
                FROM notes
                WHERE revised_by_id IS NOT NULL
              )
            `),
          },
        ],
      },
      recordType,
      recordId,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    };

    const queryOrder = orderBy
      ? [[orderBy, order.toUpperCase()]]
      : [
          [
            // Pin TREATMENT_PLAN on top
            Sequelize.literal(
              `case when "Note"."note_type" = '${NOTE_TYPES.TREATMENT_PLAN}' then 0 else 1 end`,
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

    const where = noteType
      ? {
          ...baseWhere,
          noteType,
        }
      : baseWhere;
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
