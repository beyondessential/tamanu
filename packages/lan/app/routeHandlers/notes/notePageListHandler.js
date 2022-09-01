export const notePageListHandler = recordType => async (req, res) => {
  const { models, params } = req;
  const recordId = params.id;

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
  });

  res.send({ data: rows, count: rows.length });
};

export const notePagesWithSingleItemListHandler = recordType => async (req, res) => {
  const { models, params } = req;
  req.checkPermission('read', 'PatientCarePlan');

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
      recordId: params.id,
      recordType,
    },
    order: [['createdAt', 'ASC']],
  });

  const notes = await Promise.all(notePages.map(n => n.getCombinedNoteObject(models)));
  res.send({ data: notes, count: notes.length });
};
