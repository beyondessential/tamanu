const SEQUELIZE_MIGRATION_UTILS = ['createTable', 'addColumn', 'changeColumn'];
const IGNORE_COLUMNS_SNAKE_CASE = ['created_at', 'deleted_at', 'updated_at'];

const IGNORE_COLUMNS = [
  ...IGNORE_COLUMNS_SNAKE_CASE,
  ...IGNORE_COLUMNS_SNAKE_CASE.map(x => x.replace(/_([a-z])/, (_, c1) => c1.toUpperCase())),
];

const AST_TYPES = {
  MemberExpression: 'MemberExpression',
  ObjectExpression: 'ObjectExpression',
  Property: 'Property',
};

const isOfType = (node, ...types) => types.includes(node?.type);

const isSequelizeDate = node =>
  ['Sequelize', 'DataTypes'].includes(node?.object?.name) &&
  ['DATE', 'DATEONLY'].includes(node?.property?.name);

const checkColumn = (colName, colData, context, messageId) => {
  if (
    !isOfType(colData, AST_TYPES.MemberExpression, AST_TYPES.ObjectExpression) ||
    IGNORE_COLUMNS.includes(colName)
  )
    return;
  const expNode = isOfType(colData, AST_TYPES.MemberExpression)
    ? colData
    : colData.properties.find(x => x.key?.name === 'type')?.value;

  if (isSequelizeDate(expNode)) {
    context.report({
      node: expNode,
      messageId,
    });
  }
};

const checkProperties = (node, context, messageId) => {
  const { properties } = node;
  if (!properties) return;
  properties.forEach(property => {
    const { key, value } = property;
    if (!isOfType(property, AST_TYPES.Property)) return;
    checkColumn(key.name, value, context, messageId);
  });
};

module.exports = {
  meta: {
    messages: {
      migrations:
        'Use DataTypes.DATESTRING or DataTypes.DATETIMESTRING types for all new or updated columns in migrations',
      models: 'Use custom dateTimeTypes types for all new columns on models',
    },
    fixable: 'code',
    type: 'problem',
  },
  create(context) {
    return {
      CallExpression: node => {
        if (!node.callee.property) return;
        const { object, property } = node.callee;
        const { name } = property;
        if (SEQUELIZE_MIGRATION_UTILS.includes(name)) {
          if (name === 'createTable') {
            const objNode = node?.arguments[1];
            if (!isOfType(objNode, AST_TYPES.ObjectExpression)) return;
            checkProperties(objNode, context, 'migrations');
          } else {
            checkColumn(node?.arguments[1]?.value, node?.arguments[2], context, 'migrations');
          }
        } else if (object?.type === 'Super' && name === 'init') {
          const objNode = node.arguments[0];
          checkProperties(objNode, context, 'models');
        }
      },
    };
  },
};
