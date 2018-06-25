const { findKey, get } = require('lodash');

const internals = {};

internals.getDevice = (req, res) => {
  const userServices = get(req.user, 'services', {});
  const key = findKey(userServices, { connected: true });
  if (!key) return res.status(404).end();

  return res.json({
    model: key,
    // TODO: more here tbd...
  });
};

module.exports = internals.getDevice;
