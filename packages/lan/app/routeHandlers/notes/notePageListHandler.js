export const notePageListHandler = async (req, res) => {
  const { models, params } = req;
  const recordId = params.id;

  const { rows, count } = await models.NotePage.findAndCountAll({
    include: [
      {
        model: models.NoteItem,
        as: 'noteItems',
        where: { revisedById: null },
      },
    ],
    where: { recordId },
  });

  console.log('notePages', rows);
  res.send({ data: rows, count });
};
