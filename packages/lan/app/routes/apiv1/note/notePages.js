import express from 'express';
import asyncHandler from 'express-async-handler';
import { noteItems } from './noteItems';

const notePageRoute = express.Router();
export { notePageRoute as notePages };

notePageRoute.post(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Encounter');

    const { models, body: noteData } = req;

    // req.checkPermission('write', 'NotePage');

    const notePage = await models.NotePage.create({
      recordType: noteData.recordType,
      recordId: noteData.recordId,
      date: noteData.date,
      type: noteData.type,
    });

    const noteItem = await models.NoteItem.create({
      notePageId: notePage.id,
      authorId: noteData.authorId,
      onBehalfOfId: noteData.onBehalfOfId,
      date: noteData.date,
      content: noteData.content.trim(),
    });

    res.send({ notePage, noteItem });
  }),
);

notePageRoute.get(
  '/:id',
  asyncHandler(async (req, res) => {
    // req.checkPermission('read', 'NotePage');

    const { models, params } = req;
    const notePageId = params.id;
    const notePage = await models.NotePage.findOne({
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
      where: { id: notePageId },
    });

    // req.checkPermission('read', notePage);

    res.send(notePage);
  }),
);

notePageRoute.use(noteItems);
