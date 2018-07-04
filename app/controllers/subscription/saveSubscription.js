const { buildCheckFunction, validationResult } = require('express-validator/check');
const { to } = require('await-to-js');
const dbService = require('../../services/database');
const { chain } = require('lodash');

const { pushDB } = dbService.getDBs();
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
  const { clientId, clientToken, remoteSeq } = req.body;
  const [err, result] = await to(pushDB.insertAsync({ clientId, clientToken, remoteSeq }));
  if (err) return res.status(500).send(err.stack);
  res.json(result);
};

module.exports = [
  internals.validateBody,
  internals.saveSubscription
];
