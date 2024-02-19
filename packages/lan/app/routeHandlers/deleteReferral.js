import asyncHandler from 'express-async-handler';

export const deleteReferral = asyncHandler(async (req, res) => {
  const { models, params } = req;

  req.checkPermission('delete', 'Referral');

  const model = models.Referral;
  const object = await model.findByPk(params.referralId);

  if (!object) {
    throw new Error(`Cannot find referral with id ${params.referralId}`)
  }

  await object.destroy();
  res.send({ message: 'Referral deleted successfully' });
});
