import * as yup from 'yup';
import express from 'express';
import asyncHandler from 'express-async-handler';

export const userRoutes = express.Router();

const userSchema = yup.object().shape({
  displayName: yup.string().required(),
  role: yup.string().required(),
  displayId: yup.string().required(),
  email: yup.string().required(),
  password: yup.string().required(),
});

userRoutes.post(
  '/$',
  asyncHandler(async (req, res) => {
    const record = await userSchema.validate(req.body);

    const { User } = req.store.models;
    const existing = await User.findOne({ where: { email: record.email } });

    if (existing) {
      await existing.update(record);
    } else {
      await User.create(record);
    }

    res.status(204).send();
  }),
);
