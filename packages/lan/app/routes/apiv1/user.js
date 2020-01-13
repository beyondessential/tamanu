import express from 'express';
import asyncHandler from 'express-async-handler';

export const user = express.Router();

user.get('/:id', asyncHandler(async (req, res, next) => {
  const { models, params } = req;
  const u = await models.User.findByPk(params.id);
  res.send(u);
}));

user.put('/:id', asyncHandler(async (req, res, next) => {
  const { models, params } = req;
  const u = await models.User.findByPk(params.id);
  await u.update(req.body);
  res.send(u.forResponse());
}));

user.post('/$', asyncHandler(async (req, res, next) => {
  const { models } = req;
  const { password, ...details } = req.body;
  const u = await models.User.create(details);
  await u.setPassword(password);
  await u.save();

  res.send(u.forResponse());
}));
