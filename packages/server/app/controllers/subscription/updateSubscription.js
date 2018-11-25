const { buildCheckFunction, validationResult } = require('express-validator/check');
const { to } = require('await-to-js');
const { chain } = require('lodash');
// const dbService = require('../../services/database');

// const { pushDB } = dbService.getDBs();
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

internals.updateSubscription = async (req, res) => {
  // const realm = req.app.get('realm');
  // const { clientId, clientToken, remoteSeq } = req.body;
  // const { id } = req.params;
  // const [err, subscription] = await to(pushDB.getAsync(id));
  // if (err) return res.status(500).send(err.stack);

  // subscription.clientId = clientId;
  // subscription.clientToken = clientToken;
  // subscription.remoteSeq = remoteSeq;
  // const [_err, result] = await to(pushDB.insertAsync(subscription));
  // if (_err) return res.status(500).send(_err.stack);
  // return res.json(result);
  return res.json({});
};

module.exports = [
  internals.validateBody,
  internals.updateSubscription
];
