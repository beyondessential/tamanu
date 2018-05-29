import Backbone from 'backbone-associations';
import { map } from 'lodash';
import BackbonePouch from 'backbone-pouch';
import { patientDB } from '../utils/dbHelper';

const defaultpageSize = 5;

export default Backbone.Collection.extend({
  initialize() {
    this.totalPages = 0;
    this.currentPage = 0;
    this.pageSize = defaultpageSize;
  },

  sync: BackbonePouch.sync({
    db: patientDB,
    fetch: 'query',
    options: {
      query: {
        include_docs: true,
        fun: 'patient_by_display_id',
        limit: defaultpageSize
      },
      changes: {
        include_docs: true
      }
    },
  }),

  parse(result) {
    // console.log('_this_', this);
    this.totalPages = Math.ceil(result.total_rows / this.pageSize);
    return map(result.rows, obj => (obj.doc ? obj.doc : obj));
  },

  fetchResults(opts) {
    this.fetch({
      success: (opts ? opts.success : null),
      error: (opts ? opts.error : null),
      fetch: 'query',
      options: {
        query: {
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
