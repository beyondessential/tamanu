import express from 'express';
import asyncHandler from 'express-async-handler';

const noteItemRoute = express.Router();
export { noteItemRoute as noteItems };

noteItemRoute.post(
  '/:notePageId/noteItems',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Encounter');

    const { models, body: noteItemData, params } = req;
    const { notePageId } = params;

    // req.checkPermission('write', 'NotePage');

    const createdNoteItem = await models.NoteItem.create({
      notePageId,
      authorId: noteItemData.authorId,
      onBehalfOfId: noteItemData.onBehalfOfId,
      date: Date.now(),
      content: noteItemData.content.trim(),
      revisedById: noteItemData.revisedById,
    });

    await models.NoteItem.findOne({
      where: {
        id: createdNoteItem.id,
      },
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
    req.checkPermission('read', 'Encounter');

    const { models, params } = req;
    const { notePageId } = params;
    // req.checkPermission('write', 'NotePage');

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
  '/:rootNoteItemId/noteItems',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Encounter');

    const { models, params } = req;
    const { rootNoteItemId } = params;
    // req.checkPermission('write', 'NotePage');

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
      where: { revisedById: rootNoteItemId },
      order: [['created_at', 'DESC']],
    });

    res.send({ data: noteItems });
  }),
);
