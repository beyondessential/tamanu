export const notePageListHandler = recordType => async (req, res) => {
  const { models, params, query } = req;
  const { order = 'ASC', orderBy } = query;

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
    where: { recordType, recordId },
    order: orderBy ? [[orderBy, order.toUpperCase()]] : undefined,
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
    },
    order: [['createdAt', 'ASC']],
  });

  const notes = [];
  for (const notePage of notePages) {
    const combinedNoteObject = await notePage.getCombinedNoteObject(models);
    notes.push(combinedNoteObject);
  }

  const resultNotes = notes.filter(n => !!n);
  res.send({ data: resultNotes, count: resultNotes.length });
};
