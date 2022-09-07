module.exports = {
  rules: {
    'references-empty': [2, 'never'],
  },
  ignores: [message => message.toUpperCase().startsWith('NO-ISSUE')],
  parserPreset: {
    parserOpts: {
      issuePrefixes: ['EPI-', 'TAN-', 'WAITM-', 'RN-', 'NOT-'],
    },
  },
};
