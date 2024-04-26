import express from 'express';
import asyncHandler from 'express-async-handler';
import { pick } from 'lodash';
import * as yup from 'yup';

export const usersRouter = express.Router();

usersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { User },
      },
    } = req;

    req.checkPermission('list', 'User');

    const users = await User.findAll({ include: 'facilities' });

    res.send({
      data: await Promise.all(users.map(async user => {
        const obj = user.get({ plain: true });
        return {
          ...pick(obj, [
            'id',
            'displayName',
            'email',
            'phoneNumber',
            'role',
          ]),
          allowedFacilities: await user.allowedFacilities(),
        };
      }))
    });
  }),
);

const VALIDATION = yup.object().shape({
  displayName: yup.string().required(),
  role: yup.string().required(),
  displayId: yup.string(),
  phoneNumber: yup.string(),
  password: yup.string().required(),
  email: yup
    .string()
    .email()
    .required(),
}).noUnknown();

usersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      store: {
        models: { User },
      },
    } = req;

    req.checkPermission('create', 'User');

    const fields = await VALIDATION.validate(req.body);
    await User.create(fields);

    res.send({ ok: true });
  }),
);
