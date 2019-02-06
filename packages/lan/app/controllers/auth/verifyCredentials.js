const { buildCheckFunction, validationResult } = require('express-validator/check');
const { chain } = require('lodash');
const AuthService = require('../../services/auth');

const internals = {
  checkBody: buildCheckFunction(['body'])
};

internals.validateBody = [
  internals.checkBody('clientId').exists().withMessage('clientId is required'),
  internals.checkBody('clientSecret').isEmail().exists().withMessage('clientSecret is required'),
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

internals.verifyCredentials = async (req, res) => {
  const database = req.app.get('database');
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

module.exports = [
  internals.verifyCredentials
];
