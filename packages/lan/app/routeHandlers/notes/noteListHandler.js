import { Op } from 'sequelize';
import asyncHandler from 'express-async-handler';
import { NOTE_TYPES, VISIBILITY_STATUSES } from '@tamanu/shared/constants';

import { checkNotePermission } from '../../utils/checkNotePermission';

const getNonTreatmentPlanRowsOffset = (page, rowsPerPage, treatmentPlanNotesCount) => {
  if (!page || !rowsPerPage) return undefined;
  // if treatmentPlanNotesCount was not fetched after above condition, it is not a number
  // and offset should be 0 since we are fetching part of the row as treatmentPlanNotes
  // and the rest as non-treatmentPlanNotes
  if (typeof treatmentPlanNotesCount === 'number')
    return page * rowsPerPage - treatmentPlanNotesCount;
  return 0;
};

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
      },
    ];

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
            // [Op.notIn]: await models.Note.findAll({
            //   attributes: ['revisedById'],
            //   where: {
            //     revisedById: {
            //       [Op.not]: null,
            //     },
            //   }
            // }),
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

    const queryOrder = orderBy ? [[orderBy, order.toUpperCase()]] : [['date', 'DESC']];

    let rows;
    let totalCount;

    if (noteType) {
      const noteTypeFilteredWhere = {
        ...baseWhere,
        noteType,
      };
      rows = await models.Note.findAll({
        include,
        where: noteTypeFilteredWhere,
        order: queryOrder,
        limit: rowsPerPage,
        offset: page && rowsPerPage ? page * rowsPerPage : undefined,
      });
      totalCount = await models.Note.count({
        where: noteTypeFilteredWhere,
      });
    } else {
      const treatmentPlanRows = await models.Note.findAll({
        include,
        where: {
          ...baseWhere,
          noteType: NOTE_TYPES.TREATMENT_PLAN,
        },
        order: queryOrder,
        limit: rowsPerPage,
        offset: page && rowsPerPage ? page * rowsPerPage : undefined,
      });

      let nonTreatmentPlanRows = [];
      const remainingLimit = rowsPerPage
        ? Math.max(rowsPerPage - treatmentPlanRows.length, 0)
        : undefined;
      if (!rowsPerPage || remainingLimit) {
        let treatmentPlanNotesCount;
        // remainingLimit is a number, rowsPerPage is a string
        // eslint-disable-next-line eqeqeq
        if (rowsPerPage && remainingLimit == rowsPerPage) {
          treatmentPlanNotesCount = await models.Note.count({
            where: {
              ...baseWhere,
              noteType: NOTE_TYPES.TREATMENT_PLAN,
            },
          });
        }
        nonTreatmentPlanRows = await models.Note.findAll({
          include,
          where: {
            ...baseWhere,
            noteType: {
              [Op.ne]: NOTE_TYPES.TREATMENT_PLAN,
            },
          },
          order: queryOrder,
          limit: remainingLimit,
          offset: getNonTreatmentPlanRowsOffset(page, rowsPerPage, treatmentPlanNotesCount),
        });
      }

      rows = [...(treatmentPlanRows || []), ...(nonTreatmentPlanRows || [])];

      totalCount = await models.Note.count({
        where: baseWhere,
      });
    }

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
