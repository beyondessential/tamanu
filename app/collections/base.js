import Backbone from 'backbone-associations';
import { map, keys, set, isEmpty } from 'lodash';
// import dbService from '../services/database';
// import BackbonePouch from 'backbone-pouch';

const defaultpageSize = 5;

export default Backbone.Collection.extend({
  initialize() {
    this.totalPages = 0;
    this.currentPage = 0;
    this.pageSize = defaultpageSize;
  },

  url: process.env.LAN_REALM,
  // sync: BackbonePouch.sync({
  //   db: () => dbService.patientDB,
  //   fetch: 'query',
  //   options: {
  //     query: {
  //       include_docs: true,
  //       fun: 'patient_by_display_id',
  //       limit: defaultpageSize
  //     },
  //     changes: {
  //       include_docs: true
  //     }
  //   },
  // }),

  parse(result) {
    if (result.rows) {
      this.totalPages = Math.ceil(result.total_rows / this.pageSize);
      return map(result.rows, obj => (obj.doc ? obj.doc : obj));
    }
    return result;
  },

  async fetch(options) {
    // Proxy the call to the original save function
    // const res = await Backbone.Collection.prototype.fetch.apply(this, [options]);
    // return res;
    const originalSuccess = options.success;
    options.success = async () => {
      if (options.fetchRelations) await this.fetchRelations({ relations: options.fetchRelations, deep: false });
      if (originalSuccess) originalSuccess.call();
    };
    return Backbone.Collection.prototype.fetch.apply(this, [options]);
  },

  fetchAll(opts = {}) {
    const model = new this.model();
    const { docType } = model.attributes;
    const fields = opts.fields || keys(model.attributes);
    const selector = opts.selector || {};
    const limit = opts.limit || 10;
    set(selector, 'docType', docType);

    return this.fetch({
      fetchRelations: opts.fetchRelations || false,
      success: (opts ? opts.success : null),
      error: (opts ? opts.error : null),
      fetch: 'find',
      options: {
        find: { selector, fields, limit }
      }
    });
  },

  fetchResults(opts = {}) {
    const model = new this.model();
    const { docType } = model.attributes;
    const fields = (opts && opts.fields) || keys(model.attributes);
    const selector = (opts && opts.selector) || {};
    const limit = this.pageSize;
    const skip = (this.currentPage * this.pageSize);
    set(selector, 'docType', docType);

    const params = {
      fetchRelations: opts.fetchRelations || false,
      success: (opts ? opts.success : null),
      error: (opts ? opts.error : null),
      fetch: 'find',
      options: {
        find: {
          selector,
          fields,
          limit,
          skip
        }
      }
    };
    return this.fetch(params);
  },

  fetchByView(opts = {}) {
    const { fetchRelations, success, error, view } = opts;
    const params = {
      fetchRelations: fetchRelations || false,
      success: success || null,
      error: error || null,
      fetch: 'query',
      options: {
        query: {
          fun: view || 'patient_by_display_id',
          limit: this.pageSize,
          skip: (this.currentPage * this.pageSize),
          ...opts
        }
      }
    };

    return this.fetch(params);
  },

  find(opts = {}) {
    const model = new this.model();
    const { docType } = model.attributes;
    const fields = (opts && opts.fields) || keys(model.attributes);
    let selector = (opts && opts.selector) || {};
    const limit = (opts && opts.limit) || 10;
    if (!isEmpty(selector)) {
      selector = {
        $and: selector.concat([
          { docType }
        ])
      };
    } else {
      selector = { docType };
    }

    return this.fetch({
      fetchRelations: opts.fetchRelations || false,
      success: (opts ? opts.success : null),
      error: (opts ? opts.error : null),
      fetch: 'find',
      options: {
        find: { selector, fields, limit }
      }
    });
  },

  async fetchRelations(props = { relations: true, deep: false }) {
    const { relations, deep } = props;
    const tasks = [];
    this.models.forEach(model => {
      tasks.push(model.fetch({ relations, deep }));
    });
    await Promise.all(tasks);
  },

  setPage(page) {
    this.currentPage = page;
  },

  setPageSize(pageSize) {
    this.pageSize = pageSize;
  }
});
