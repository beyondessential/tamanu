import { buildCheckFunction, validationResult } from 'express-validator/check';
import { chain } from 'lodash';
import AuthService from '../../services/auth';

const checkBody = buildCheckFunction(['body']);
const validateBody = [
  checkBody('clientId').exists().withMessage('clientId is required'),
  checkBody('clientSecret').isEmail().exists().withMessage('clientSecret is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        error: chain(errors.array()).map('msg').uniq().value(),
      });
    }
    return next();
  },
];

const verifyCredentials = async (req, res) => {
  const database = req.app.get('database');
  console.log('-verifyCredentials-', database);
  const { clientId, clientSecret } = req.body;

  try {
    const authService = new AuthService(database);
    const loginCheck = await authService.verifyExtendToken({ clientId, clientSecret });
    return res.json({
      userId: loginCheck.userId,
      clientId: loginCheck.clientId,
      clientSecret: loginCheck.clientSecret,
    });
  } catch (err) {
    return res.status(404).send(err.toString());
  }
};

export default [verifyCredentials];
