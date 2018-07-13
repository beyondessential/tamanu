import Backbone from 'backbone-associations';
import { map, keys } from 'lodash';
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
    // console.log('_this_', this);
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
    const { type } = model.attributes;
    const fields = keys(model.attributes);

    this.fetch({
      success: (opts ? opts.success : null),
      error: (opts ? opts.error : null),
      fetch: 'find',
      options: {
        find: {
          selector: { type }, fields
        }
      }
    });
  },

  fetchResults(opts) {
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
