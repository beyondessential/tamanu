import { Sequelize, Op } from 'sequelize';

/*
Returns an array with the correct structure to support regular
ordering and also on nested columns as expected with a string path.

The string path should be the association name, followed by
the desired column name to be ordered by. The string path should
be separated by a dot (.) and it can also have nested associations.
*/
export const getOrderClause = (order, orderBy) => {
  const nestedAttributes = orderBy.split('.');
  return [[...nestedAttributes, order.toUpperCase()]];
};

/* 
Maps query params to expected Sequelize query format.

searchParams: Object
options: Array<Object>
option: {
  key: String
  alias: String (not required, will default to key)
  operator: Sequelize Operator (Sequelize.Op)
  mapFn: Function that returns an accepted sequelize 'where' filter object
}
*/
export const mapQueryFilters = (params, options) => {
  // Helper function used as the default mapFn
  const defaultFilter = (fieldName, operator, value) => {
    return { [fieldName]: { [operator]: value } };
  };

  const queryFilters = [];

  // Go through each filter option
  options.forEach(({ key, alias, operator, mapFn = defaultFilter }) => {
    // Extract search parameter value
    const value = params[key];

    // Extract specified keys without undefined or null values
    if (value !== null && value !== undefined) {
      // Map key to specified alias or default to key
      const newKey = alias || key;

      // Add new filter
      queryFilters.push(mapFn(newKey, operator, value));
    }
  });

  if (queryFilters.length > 0) {
    return { [Op.and]: queryFilters };
  }
  return {};
};

/*
  Returns a function that creates a case insensitive filter by calling the 
  'UPPER' function from SQL in both the column and the value to match against 
  using a custom operator. It binds a fields object that maps the model's
  fieldnames to the actual database column names.
*/
export const getCaseInsensitiveFilter = fields => {
  return (fieldName, operator, value) => {
    const columnName = fields[fieldName];
    const filterValue = Sequelize.where(Sequelize.fn('upper', Sequelize.col(columnName)), {
      [operator]: value.toUpperCase(),
    });

    return { [fieldName]: filterValue };
  };
};

/*
  Returns a function that creates an equal comparison filter that maps 
  a text value to a boolean value. Useful for displaying dropdowns
  on form fields instead of checkboxes. It binds a string expected
  to be transformed to true, other strings will default to false.
*/
export const getTextToBooleanFilter = trueString => {
  return (fieldName, operator, value) => ({ [fieldName]: { [operator]: value === trueString } });
};
