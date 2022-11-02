const { RuleTester } = require('eslint');
const rule = require('./no-date-constructor-with-param');

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2018 } });

ruleTester.run('no-date-constructor-with-param', rule, {
  valid: [
    {
      code: 'new Date()',
    },
  ],
  invalid: [
    {
      code: 'new Date(stringDate)',
      errors: [
        {
          messageId: 'main',
        },
      ],
    },
  ],
});
