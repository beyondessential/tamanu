import { Utils, QueryTypes } from 'sequelize';

/* eslint-disable no-param-reassign */
// This is mostly copied from Model.findAll internals in sequelize
// and as such is highly coupled to the internals of sequelize 6.
// However, there's no other reliable way to get the SQL :(
export async function prepareQuery(Model, query) {
  let options = query || { where: {} };

  Model.warnOnInvalidOptions(options, Object.keys(Model.rawAttributes));
  const tableNames = {};
  tableNames[Model.getTableName(options)] = true;
  options.hooks = false;
  options.rejectOnEmpty = Object.prototype.hasOwnProperty.call(options, 'rejectOnEmpty')
    ? options.rejectOnEmpty
    : Model.options.rejectOnEmpty;
  Model._injectScope(options);
  if (options.hooks) {
    await Model.runHooks('beforeFind', options);
  }
  Model._conformIncludes(options, Model);
  Model._expandAttributes(options);
  Model._expandIncludeAll(options);
  if (options.hooks) {
    await Model.runHooks('beforeFindAfterExpandIncludeAll', options);
  }
  options.originalAttributes = Model._injectDependentVirtualAttributes(options.attributes);
  if (options.include) {
    options.hasJoin = true;
    Model._validateIncludedElements(options, tableNames);
    if (
      options.attributes &&
      !options.raw &&
      Model.primaryKeyAttribute &&
      !options.attributes.includes(Model.primaryKeyAttribute) &&
      (!options.group || !options.hasSingleAssociation || options.hasMultiAssociation)
    ) {
      options.attributes = [Model.primaryKeyAttribute].concat(options.attributes);
    }
  }
  if (!options.attributes) {
    options.attributes = Object.keys(Model.rawAttributes);
    options.originalAttributes = Model._injectDependentVirtualAttributes(options.attributes);
  }
  Model.options.whereCollection = options.where || null;
  Utils.mapFinderOptions(options, Model);
  options = Model._paranoidClause(Model, options);
  if (options.hooks) {
    await Model.runHooks('beforeFindAfterOptions', options);
  }

  const selectOptions = {
    ...options,
    tableNames: Object.keys(tableNames),
    type: QueryTypes.SELECT,
    model: Model,
  };

  return Model.queryGenerator.selectQuery(Model.getTableName(selectOptions), selectOptions, Model);
}
