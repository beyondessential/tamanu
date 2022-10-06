import express from 'express';
import asyncHandler from 'express-async-handler';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';

const noteItemRoute = express.Router();
export { noteItemRoute as noteItems };

noteItemRoute.post(
  '/:notePageId/noteItems',
  asyncHandler(async (req, res) => {
    const { models, body: noteItemData, params, user } = req;
    const { notePageId } = params;

    // When users try to edit a note item, only allow users who have OtherPractitionerEncounterNote permission
    // or the author of that note item
    if (noteItemData.revisedById && noteItemData.authorId !== user.id) {
      req.checkPermission('write', 'OtherPractitionerEncounterNote');
    }

    const notePage = await models.NotePage.findByPk(notePageId);
    const owner = await models[notePage.recordType].findByPk(notePage.recordId);
    req.checkPermission('write', owner);

    await models.NoteItem.create({
      notePageId,
      authorId: noteItemData.authorId,
      onBehalfOfId: noteItemData.onBehalfOfId,
      date: getCurrentDateTimeString(),
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
