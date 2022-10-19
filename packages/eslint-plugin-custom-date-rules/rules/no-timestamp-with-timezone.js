const reportProblem = (context, node) => {
  const { upper } = context.getScope();
  if (upper?.block?.superClass?.name === 'Model') {
    context.report({ node, messageId: 'models' });
  } else if (
    upper.variables.filter(
      ({ name, scope }) => ['up', 'down'].includes(name) && scope.type === 'module',
    ).length === 2
  ) {
    context.report({
      node,
      messageId: 'migrations',
    });
  }
};

module.exports = {
  meta: {
    messages: {
      migrations:
        'Use DataTypes.DATESTRING or DataTypes.DATETIMESTRING types for all new columns in migrations',
      models: 'Use custom dateTimeTypes.js types for all new columns on models',
    },
    fixable: 'code',
    type: 'problem',
  },
  create(context) {
    return {
      'MemberExpression[property.name=DATE][object.name=/(Sequelize|DataTypes)/]': node => {
        reportProblem(context, node);
      },
      'ImportDeclaration[source.value=sequelize] > ImportSpecifier > Identifier[name=DATE]': node => {
        reportProblem(context, node);
      },
    };
  },
};
