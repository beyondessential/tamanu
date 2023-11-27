import asyncHandler from 'express-async-handler';

export const deleteDocumentMetadata = asyncHandler(async (req, res) => {
  const { models, params } = req;
  req.checkPermission('delete', 'DocumentMetadata');

  const model = models.DocumentMetadata;
  const object = await model.findByPk(params.documentMetadataId);
  if (object) {
    await object.destroy();
  }

  res.send({ message: 'Document deleted successfully' });
});
