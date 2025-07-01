import express from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import * as yup from 'yup';
import { ValidationError } from 'yup';
import { log } from '@tamanu/shared/services/logging';

export const changePasswordAuthenticated = express.Router();

const schema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .required('Password confirmation is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

changePasswordAuthenticated.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { store, body, user } = req;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await schema.validate(body);

    await doChangePasswordAuthenticated(store, body, user);

    log.info('changePasswordAuthenticated.success', { userId: user.id });
    res.send({ success: true });
  }),
);

const doChangePasswordAuthenticated = async (store, { currentPassword, newPassword }, user) => {
  const { models } = store;

  // Get user with password to verify current password
  const userWithPassword = await models.User.scope('withPassword').findByPk(user.id);
  
  if (!userWithPassword) {
    throw new ValidationError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
  
  if (!isCurrentPasswordValid) {
    log.warn('changePasswordAuthenticated.invalidCurrentPassword', { userId: user.id });
    throw new ValidationError('Current password is incorrect');
  }

  // Update password (User model will handle hashing via beforeUpdate hook)
  await models.User.update(
    { password: newPassword },
    { where: { id: user.id } }
  );
};