module.exports = {
  rules: {
    'references-empty': [2, 'never'], // validate referencing ticket with error level
  },
  ignores: [message => message.toUpperCase().startsWith('NO-ISSUE')], // allow bypassing the validation (if wanted)
  parserPreset: {
    parserOpts: {
      issuePrefixes: ['EPI-', 'TAN-', 'WAITM-', 'RN-', 'NOT-'], // case insensitive
    },
  },
};
