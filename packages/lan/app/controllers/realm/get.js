import { parseInt, isEmpty } from 'lodash';
import { objectToJSON } from '../../utils';

const OBJECTS_MAX_DEPTH = 5;

export function handleGenericGetRequest(req, res, prefilters = null) {
  const { db, params, query } = req;
  const { model: modelName, id, fuzzy } = params;
  const {
    orderBy,
    order,
    page: currentPageString,
    rowsPerPage: pageSizeString,
    ...restOfQuery
  } = query;
  const defaultPageSize = 10;

  try {
    // If id is provided, return single object
    if (id) {
      const object = db.objectForPrimaryKey(modelName, id);
      if (!object) return res.status(404).end();
      // Get first item from the list
      const data = objectToJSON(object, OBJECTS_MAX_DEPTH);
      return res.json(data);
    }

    // Add any additional filters from query parameters
    const schema = db.schema.find(({ name }) => name === modelName);
    if (!schema) {
      throw new Error(`No schema for ${modelName}`);
    }
    const { properties: fieldSchemata } = schema;
    const filters = Object.entries(restOfQuery).map(([field, value]) => {
      const fieldSchema = fieldSchemata[field] || {};
      const isString = fieldSchema === 'string' || fieldSchema.type === 'string';
      let operator = '=';
      let newValue = value;
      if (/([|])/.test(value)) {
        [operator, newValue] = value.split('|');
      } else if (isString && fuzzy) {
        // one day this could be proper fuzzy matching!
        operator = 'CONTAINS[c]';
      }
      const valueString = isString ? `"${newValue}"` : newValue;
      return `${field} ${operator} ${valueString}`;
    });

    let objects = db.objects(modelName);

    if (prefilters) {
      objects = prefilters(objects);
    }

    // Filter collection on all filters
    if (!isEmpty(filters)) objects = objects.filtered(filters.join(' AND '));

    // Sort results
    if (orderBy) objects = objects.sorted(orderBy, order === 'desc');

    // Create pagination options before limiting
    const response = { count: objects.length };

    // Limit results
    if (currentPageString) {
      const currentPage = parseInt(currentPageString);
      const pageSize = pageSizeString ? parseInt(pageSizeString) : defaultPageSize;
      const start = currentPage * pageSize;
      const end = start + pageSize;
      objects = objects.slice(start, end);
    }

    // Convert to JSON as response
    response.data = objects.map(object => objectToJSON(object, OBJECTS_MAX_DEPTH));
    return res.send(response);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.toString());
  }
}

export default function(req, res) {
  handleGenericGetRequest(req, res);
}
