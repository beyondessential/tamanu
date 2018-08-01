import Backbone from 'backbone-associations';
import { map, keys, set } from 'lodash';
// import dbService from '../services/database';
// import BackbonePouch from 'backbone-pouch';

const defaultpageSize = 5;

export default Backbone.Collection.extend({
  initialize() {
    this.totalPages = 0;
    this.currentPage = 0;
    this.pageSize = defaultpageSize;
  },

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
    // console.log('_parse_', result);
    this.totalPages = Math.ceil(result.total_rows / this.pageSize);
    return map(result.rows, obj => (obj.doc ? obj.doc : obj));
  },

  async fetch(options) {
    // Proxy the call to the original save function
    // const res = await Backbone.Collection.prototype.fetch.apply(this, [options]);
    // return res;
    return Backbone.Collection.prototype.fetch.apply(this, [options]);
  },

  fetchAll(opts) {
    const model = new this.model();
    const { docType } = model.attributes;
    const fields = opts.fields || keys(model.attributes);
    const selector = opts.selector || {};
    const limit = opts.limit || 10;
    set(selector, 'docType', docType);

    this.fetch({
      success: (opts ? opts.success : null),
      error: (opts ? opts.error : null),
      fetch: 'find',
      options: {
        find: { selector, fields, limit }
      }
    });
  },

  fetchResults(opts) {
    const model = new this.model();
    const { type } = model.attributes;
    const fields = (opts && opts.fields) || keys(model.attributes);
    const selector = (opts && opts.selector) || {};
    const limit = this.pageSize;
    const skip = (this.currentPage * this.pageSize);
    set(selector, 'type', type);

    const params = {
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
    this.fetch(params);
  },

  fetchByView(opts) {
    this.fetch({
      success: (opts ? opts.success : null),
      error: (opts ? opts.error : null),
      fetch: 'query',
      options: {
        query: {
          fun: (opts && opts.view) || 'patient_by_display_id',
          limit: this.pageSize,
          skip: (this.currentPage * this.pageSize)
        }
      }
    });
  },

  lookUp(opts) {
    this.fetch({
      success: (opts ? opts.success : null),
      error: (opts ? opts.error : null),
      fetch: 'find',
      options: {
        find: {
          selector: opts.selector,
          fields: opts.fields,
          limit: opts.limit || 10
        }
      }
    });
  },

  setPage(page) {
    this.currentPage = page;
  },

  setPageSize(pageSize) {
    this.pageSize = pageSize;
  }
});
