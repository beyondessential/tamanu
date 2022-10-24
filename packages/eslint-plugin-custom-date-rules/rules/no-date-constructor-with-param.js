module.exports = {
  meta: {
    type: 'problem',
  },
  create(context) {
    return {
      'NewExpression[callee.name=Date][arguments.length > 0]': node => {
        context.report({
          node,
          message:
            'When initializing dates with date strings use parseISO() if sure of format or parseDate() instead',
        });
      },
    };
  },
};
