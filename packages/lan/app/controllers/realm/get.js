import { parseInt, isEmpty } from 'lodash';
import { objectToJSON } from '../../utils';

const OBJECTS_MAX_DEPTH = 5;

export default function(req, res) {
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
    return db.write(() => {
      let objects = db.objects(modelName);
      const filters = [];

      // If id is provided, return single object
      if (id) {
        objects = objects.filtered(`_id = '${id}'`);
        if (objects.length <= 0) return res.status(404).end();
        // Get first item from the list
        const object = objectToJSON(objects[0], OBJECTS_MAX_DEPTH);
        return res.json(object);
      }

      // Add any additional filters from query parameters
      const { properties: fieldSchemata } = db.schema.find(({ name }) => name === modelName);
      Object.entries(restOfQuery).forEach(([field, value]) => {
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
        filters.push(`${field} ${operator} ${valueString}`);
      });

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
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.toString());
  }
}
