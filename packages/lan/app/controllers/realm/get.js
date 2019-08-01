import { parseInt, ceil, head, isEmpty } from 'lodash';
import { objectToJSON } from '../../utils';

export default function(req, res) {
  const realm = req.app.get('database');
  const { params, query } = req;
  const { model: modelName, id } = params;
  const {
    sort_by: sortBy,
    order,
    keyword,
    fields,
    current_page: currentPageString,
    page_size: pageSizeString,
    objects_max_depth: objectsMaxDepth = 5,
    ...restOfQuery
  } = query;
  const defaultPageSize = 10;

  try {
    return realm.write(() => {
      let objects = realm.objects(modelName);
      const filters = [];

      // If id is provided, return single object
      if (id) {
        objects = objects.filtered(`_id = '${id}'`);
        if (objects.length <= 0) return res.status(404).end();
        // Get first item from the list
        const object = objectToJSON(head(objects), objectsMaxDepth);
        return res.json(object);
      }

      // Add keyword filter
      if (keyword && fields) {
        const conditions = [];
        fields.split(',').forEach(field => {
          conditions.push(` ${field} CONTAINS[c] "${keyword}" `);
        });
        filters.push(`(${conditions.join(' OR ')})`);
      }

      // Add any additional filters from query parameters
      const { properties: fieldSchemata } = realm.schema.find(({ name }) => name === modelName);
      Object.entries(restOfQuery).forEach(([field, value]) => {
        let operator = '=';
        let newValue = value;
        if (/([|])/.test(value)) {
          [operator, newValue] = value.split('|');
        }
        const fieldSchema = fieldSchemata[field] || {};
        const isString = fieldSchema === 'string' || fieldSchema.type === 'string';
        const valueString = isString ? `'${newValue}'` : newValue;
        filters.push(`${field} ${operator} ${valueString}`);
      });

      // Filter collection on all filters
      if (!isEmpty(filters)) objects = objects.filtered(filters.join(' AND '));

      // Sort results
      if (sortBy) objects = objects.sorted(sortBy, order === 'desc');

      // Create pagination options before limiting
      const paginationParams = { total_entries: objects.length };

      // Limit results
      if (currentPageString) {
        const currentPage = parseInt(currentPageString);
        const pageSize = pageSizeString ? parseInt(pageSizeString) : defaultPageSize;
        const start = currentPage * pageSize;
        const end = start + pageSize;
        objects = objects.slice(start, end);
        paginationParams.total_pages = ceil(paginationParams.total_entries / pageSize);
      }

      // Convert to JSON as response
      objects = objects.map(object => objectToJSON(object, objectsMaxDepth));
      const response = [paginationParams, objects];
      return res.send(response);
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.toString());
  }
}
