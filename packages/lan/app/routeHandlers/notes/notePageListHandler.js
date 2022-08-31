export const notePageListHandler = async (req, res) => {
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
        ],
        where: {
          revisedById: null,
        },
      },
    ],
    where: { recordId },
  });

  res.send({ data: rows, count: rows.length });
};
