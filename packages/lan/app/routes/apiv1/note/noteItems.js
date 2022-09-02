import express from 'express';
import asyncHandler from 'express-async-handler';

const noteItemRoute = express.Router();
export { noteItemRoute as noteItems };

noteItemRoute.post(
  '/:notePageId/noteItems',
  asyncHandler(async (req, res) => {
    const { models, body: noteItemData, params } = req;
    const { notePageId } = params;

    const notePage = await models.NotePage.findByPk(notePageId);
    const owner = await models[notePage.recordType].findByPk(notePage.recordId);
    req.checkPermission('create', owner);

    await models.NoteItem.create({
      notePageId,
      authorId: noteItemData.authorId,
      onBehalfOfId: noteItemData.onBehalfOfId,
      date: Date.now(),
      content: noteItemData.content.trim(),
      revisedById: noteItemData.revisedById,
    });

    const noteItems = await models.NoteItem.findAll({
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
      where: { notePageId },
    });

    res.send({ data: noteItems });
  }),
);

noteItemRoute.get(
  '/:notePageId/noteItems',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Note');

    const { models, params } = req;
    const { notePageId } = params;

    const notePage = await models.NotePage.findByPk(notePageId);
    const owner = await models[notePage.recordType].findByPk(notePage.recordId);
    req.checkPermission('read', owner);

    const noteItems = await models.NoteItem.findAll({
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
      where: { notePageId },
    });

    res.send({ data: noteItems });
  }),
);
