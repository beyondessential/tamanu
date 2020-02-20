import express from 'express';
import { hash } from 'bcrypt';
import { auth } from 'config';

import { objectToJSON } from '../../utils';

const { saltRounds } = auth;

export const userRoutes = express.Router();

userRoutes.post('/user', async (req, res) => {
  const { db, body } = req;

  const { password, ...userDetails } = body;

  const existing = db.objects('user').filtered('email = $0', body.email);
  if (existing.length > 0) {
    res.status(400);
    res.send({
      message: 'User with that email already exists',
    });
    return;
  }

  const encrypted = await hash(password, saltRounds);

  let created = null;
  await db.write(() => {
    created = db.create('user', {
      password: encrypted,
      ...userDetails,
    });
  });

  res.send(objectToJSON(created));
});
