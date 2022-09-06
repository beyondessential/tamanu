import { Op } from 'sequelize';
import { NOTE_TYPES } from 'shared/constants';

export const notePageListHandler = recordType => async (req, res) => {
  const { models, params } = req;

  const recordId = params.id;
  const owner = await models[recordType].findByPk(recordId);

  req.checkPermission('read', owner);

  const rows = await models.NotePage.findAll({
    include: [
      {
        model: models.NoteItem,
        as: 'noteItems',
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
    ],
    where: { recordType, recordId, noteType: { [Op.not]: NOTE_TYPES.SYSTEM } },
  });

  res.send({ data: rows, count: rows.length });
};

export const notePagesWithSingleItemListHandler = recordType => async (req, res) => {
  const { models, params } = req;

  const recordId = params.id;
  const owner = await models[recordType].findByPk(recordId);

  req.checkPermission('read', owner);

  const notePages = await models.NotePage.findAll({
    include: [
      {
        model: models.NoteItem,
        as: 'noteItems',
        include: [
          { model: models.User, as: 'author' },
          { model: models.User, as: 'onBehalfOf' },
        ],
      },
    ],
    where: {
      recordId,
      recordType,
      noteType: { [Op.not]: NOTE_TYPES.SYSTEM },
    },
    order: [['createdAt', 'ASC']],
  });

  const notes = await Promise.all(notePages.map(n => n.getCombinedNoteObject(models)));
  res.send({ data: notes, count: notes.length });
};
