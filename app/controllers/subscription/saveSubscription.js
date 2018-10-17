const { buildCheckFunction, validationResult } = require('express-validator/check');
const { to } = require('await-to-js');
const dbService = require('../../services/database');
const { chain } = require('lodash');

const internals = {
  checkBody: buildCheckFunction(['body']),
};

internals.validateBody = [
  internals.checkBody('clientId').exists().withMessage('clientId is required'),
  internals.checkBody('clientToken').exists().withMessage('clientToken is required'),
  internals.checkBody('remoteSeq').exists().withMessage('remoteSeq is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        answers: {
          errors: chain(errors.array()).map('msg').uniq().value(),
        }
      });
    }
    return next();
  },
];

internals.saveSubscription = async (req, res) => {
  const realm = req.app.get('realm');
  const { clientId, clientToken, remoteSeq } = req.body;
  try {
    const subscription = realm.write(() => {
      return realm.create('subscription', { clientId, clientToken, remoteSeq });
    });
     return res.json(subscription);
  } catch (err) {
    return res.status(500).send(err.stack);
  }
};

module.exports = [
  internals.validateBody,
  internals.saveSubscription
];
