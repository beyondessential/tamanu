module.exports = {
  meta: {
    type: 'problem',
    messages: {
      main:
        'When initializing dates with date strings use parseISO() if sure of format or parseDate() instead',
    },
  },
  create(context) {
    return {
      'NewExpression[callee.name=Date][arguments.length > 0]': node => {
        context.report({
          node,
          messageId: 'main',
        });
      },
    };
  },
};
