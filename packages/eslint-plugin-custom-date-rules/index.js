/* eslint-disable global-require */
module.exports = {
  rules: {
    'no-timestamp-with-timezone': require('./rules/no-timestamp-with-timezone'),
    'no-date-constructor-with-param': require('./rules/no-date-constructor-with-param'),
  },
};
