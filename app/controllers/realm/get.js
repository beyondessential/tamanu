const { objectToJSON } = require('../../utils');
const { parseInt, ceil } = require('lodash');

module.exports = (req, res) => {
  const realm = req.app.get('database');
  const { params, query } = req;
  const { model, id } = params;
  let {
    current_page: currentPage,
    page_size: pageSize,
    sort_by: sortBy,
    order
  } = query;

  try {
    return realm.write(() => {
      let objects = realm.objects(model);
      if (id) {
        objects = objects.filtered(`_id = '${id}'`);
        objects = objectToJSON(objects[0]);
        return res.json(objects);
      }

      objects = objects.map(object => objectToJSON(object));
      const paginationParams = { total_entries: objects.length };

      // Limit results
      if (currentPage && pageSize) {
        currentPage = parseInt(currentPage);
        pageSize = parseInt(pageSize);
        const start = currentPage * pageSize;
        const end = start + pageSize;
        objects = objects.slice(start, end);
        paginationParams.total_pages = ceil(paginationParams.total_entries / pageSize);
      }

      if (sortBy) objects.sorted(sortBy, order === 'desc');
      const response = [paginationParams, objects];
      return res.send(response);
    });
  } catch (err) {
    return res.status(500).send(err.toString());
  }
};