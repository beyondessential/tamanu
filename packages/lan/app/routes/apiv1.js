import express from 'express';
import asyncHandler from 'express-async-handler';

export const apiv1 = express.Router();

const user = express.Router();

user.get('/:id', async (req, res, next) => {
  const { models, params } = req;
  const u = await models.User.findByPk(params.id);
  res.send(u);
});

user.put('/:id', async (req, res, next) => {
  const { models, params } = req;
  const u = await models.User.findByPk(params.id);
  await u.update(req.body);
  res.send(u.forResponse());
});

user.post('/$', asyncHandler(async (req, res, next) => {
  const { models } = req;
  const { password, ...details } = req.body;
  const u = await models.User.create(details);
  await u.setPassword(password);
  await u.save();

  res.send(u.forResponse());
}));

apiv1.use('/user', user);

apiv1.use((error, req, res, next) => {
  switch(error.name) {
    case 'SequelizeUniqueConstraintError':
    case 'SequelizeValidationError':
      res.status(400).send({ error });
      return;
    default:
      console.error(error);
      res.status(500).send({ error });
      return;
  }
});

