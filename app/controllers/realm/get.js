const { objectToJSON } = require('../../utils');
const { parseInt, ceil, each, head, isEmpty } = require('lodash');

module.exports = (req, res) => {
  const realm = req.app.get('database');
  const { params, query } = req;
  const { model, id } = params;
  const {
    sort_by: sortBy,
    order,
    keyword,
    fields,
    view: viewName
  } = query;
  const defaultPageSize = 10;
  let {
    current_page: currentPage,
    page_size: pageSize,
  } = query;

  try {
    return realm.write(() => {
      let objects = realm.objects(model);
      const filters = [];

      // Return single object
      if (id) {
        objects = objects.filtered(`_id = '${id}'`);
        if (objects.length <= 0) return res.status(404).end();
        const object = objectToJSON(head(objects));
        return res.json(object);
      }

      // Create pagination options before limiting
      const paginationParams = { total_entries: objects.length };

      // Load our filters if a view is set
      if (viewName) {
        const view = realm.getView(viewName);
        if (view) {
          let { filters: viewFilters } = view;
          viewFilters = JSON.parse(viewFilters);
          each(viewFilters, (value, field) => {
            if (typeof value === 'string') {
              filters.push(` ${field} = "${value}" `);
            } else {
              filters.push(` ${field} = ${value} `);
            }
          });
        }
      }

      // Add keyword filter
      if (keyword && fields) {
        const conditions = [];
        fields.split(',').forEach((field) => {
          conditions.push(` ${field} CONTAINS[c] "${keyword}" `);
        });
        filters.push(`(${conditions.join(' OR ')})`);
      }

      // Add filters
      if (!isEmpty(filters)) objects = objects.filtered(filters.join(' AND '));

      // Sort results
      if (sortBy) objects = objects.sorted(sortBy, order === 'desc');

      // Limit results
      if (currentPage) {
        if (!pageSize) pageSize = defaultPageSize;
        currentPage = parseInt(currentPage);
        pageSize = parseInt(pageSize);
        const start = currentPage * pageSize;
        const end = start + pageSize;
        objects = objects.slice(start, end);
        paginationParams.total_pages = ceil(paginationParams.total_entries / pageSize);
      }

      // Convert to JSON as response
      objects = objects.map(object => objectToJSON(object));
      const response = [paginationParams, objects];
      return res.send(response);
    });
  } catch (err) {
    return res.status(500).send(err.toString());
  }
};
