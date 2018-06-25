import Backbone from 'backbone-associations';
import BackbonePouch from 'backbone-pouch';
import { defaults } from 'lodash';

const defaultpageSize = 5;

export default (mainDB) => {
  Backbone.sync = BackbonePouch.sync({
    db: mainDB,
    fetch: 'allDocs',
    options: {
      query: {
        include_docs: true,
        // fun: 'patient_by_display_id',
        limit: defaultpageSize
      },
      changes: {
        include_docs: true
      },
      allDocs: {
        include_docs: true,
        limit: 10
      }
    }
  });

  // Add promise support to backbone model
  const originalSave = Backbone.Model.prototype.save;
  Backbone.Model.prototype.save = function saveData(data, options) {
    return new Promise(async (resolve, reject) => {
      const newOptions = defaults({
        wait: true,
        success: resolve,
        error: reject
      }, options);

      await originalSave.apply(this, [data, newOptions]);
    });
  };

  const originalFetch = Backbone.Model.prototype.fetch;
  Backbone.Model.prototype.fetch = function fetchData(options) {
    return new Promise((resolve, reject) => {
      const newOptions = defaults({
        success: resolve,
        error: reject
      }, options);

      originalFetch.apply(this, [newOptions]);
    });
  };

  const originalDestroy = Backbone.Model.prototype.destroy;
  Backbone.Model.prototype.destroy = function destroyData(options) {
    return new Promise((resolve, reject) => {
      const newOptions = defaults({
        wait: true,
        success: resolve,
        error: reject
      }, options);

      originalDestroy.apply(this, [newOptions]);
    });
  };

  // Backbone.sync = adaptor;
  Backbone.Model.prototype.idAttribute = '_id';
};
