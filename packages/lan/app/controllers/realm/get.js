const { parseInt, ceil, head, isEmpty, has } = require('lodash');
const moment = require('moment');
const { objectToJSON } = require('../../utils');
const { SYNC_ACTIONS } = require('../../constants');

module.exports = (req, res) => {
  const realm = req.app.get('database');
  const { params, query } = req;
  const { model, id } = params;
  const {
    sort_by: sortBy,
    order,
    keyword,
    fields,
    view: viewName,
  } = query;
  const defaultPageSize = 10;
  let {
    current_page: currentPage,
    page_size: pageSize,
    keys: viewKeys,
  } = query;

  try {
    return realm.write(() => {
      let objects = realm.objects(model);
      const filters = [];

      // Return single object
      if (id) {
        objects = objects.filtered(`_id = '${id}'`);
        if (objects.length <= 0) return res.status(404).end();
        // Mark item to be fully fetched
        if (query.fully_sync) _markToBeSynced(head(objects), model, realm);
        // Get first item from the list
        const object = objectToJSON(head(objects));
        return res.json(object);
      }

      // Create pagination options before limiting
      const paginationParams = { total_entries: objects.length };

      // Load our filters if a view is set
      if (viewName) {
        const view = realm.getView(viewName);
        if (view) {
          const { filters: viewFilters } = view;
          filters.push(viewFilters);
        }

        if (viewKeys) {
          viewKeys = viewKeys.split(',');
          viewKeys = viewKeys.map(key => (moment(key).isValid() ? moment(key).toISOString() : key));
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
      if (!viewKeys) viewKeys = [];
      if (!isEmpty(filters)) objects = objects.filtered(filters.join(' AND '), ...viewKeys);

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
    console.error(err);
    return res.status(500).send(err.toString());
  }
};

const _markToBeSynced = (object, model, realm) => {
  const { settings } = realm;
  const hospitalId = settings.get('HOSPITAL_ID');
  const hospital = realm.findOne('hospital', hospitalId);
  if (hospital) {
    let ids = [];
    let newIds = [];
    let { objectsFullySynced, modifiedFields } = hospital;
    objectsFullySynced = JSON.parse(objectsFullySynced) || {};
    if (has(objectsFullySynced, model)) ids = objectsFullySynced[model];
    if (has(objectsFullySynced, 'new')) newIds = objectsFullySynced.new;
    if (!ids.includes(object._id)) ids.push(object._id);
    newIds.push({
      _id: object._id,
      recordType: model
    });
    objectsFullySynced[model] = ids;
    objectsFullySynced.new = newIds;
    modifiedFields = JSON.parse(modifiedFields) || {};
    modifiedFields.objectsFullySynced = new Date().getTime();
    hospital.objectsFullySynced = JSON.stringify(objectsFullySynced);
    hospital.modifiedFields = JSON.stringify(modifiedFields);
    // trigger change
    realm._alertListeners(SYNC_ACTIONS.SAVE, 'hospital', hospital);
  }
}
