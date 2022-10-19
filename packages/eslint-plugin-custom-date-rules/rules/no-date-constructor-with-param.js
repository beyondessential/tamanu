/* eslint-disable custom-date-rules/no-date-constructor-with-param */
module.exports = {
  meta: {
    messages: {
      general:
        'When initializing dates with date strings use parseISO() or parseDate() instead of new Date()',
    },
    type: 'problem',
  },
  create(context) {
    return {
      'NewExpression[callee.name=Date][arguments.length > 0]': node => {
        context.report({ node, messageId: 'general' });
      },
    };
  },
};
