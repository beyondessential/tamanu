import { buildCheckFunction, validationResult } from 'express-validator/check';
import { chain } from 'lodash';
import AuthService from '../../services/auth';

const checkBody = buildCheckFunction(['body']);
const validateBody = [
  checkBody('clientId')
    .exists()
    .withMessage('clientId is required'),
  checkBody('email')
    .isEmail()
    .exists()
    .withMessage('email is required'),
  checkBody('password')
    .exists()
    .withMessage('password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: chain(errors.array())
          .map('msg')
          .uniq()
          .value(),
      });
    }
    return next();
  },
];

const login = async (req, res) => {
  const { db, body } = req;
  const { email, password, facility, clientId } = body;
  try {
    const authService = new AuthService(db);
    const doLogin = await authService.login({
      email,
      password,
      facility,
      clientId,
    });
    if (doLogin !== false) {
      const { userId, facilityId, displayName, clientSecret: secret } = doLogin;
      const abilities = authService.getAbilities({ userId, facilityId });
      return res.json({
        userId,
        facilityId,
        displayName,
        clientId,
        secret,
        abilities,
        email,
      });
    }
    throw doLogin;
  } catch (err) {
    return res.status(404).json({ error: err.toString() });
  }
};

export default [validateBody, login];
