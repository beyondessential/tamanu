import BackbonePouch from 'backbone-pouch';
import Backbone from 'backbone';
import { map } from 'lodash';
import { patientDB } from '../utils/dbHelper';

const defaultpageSize = 5;

const Base = Backbone.Collection.extend({
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
    return map(result.rows, obj => obj.doc);
  },
  fetchResults(opts) {
    // console.log({
    //   limit: this.pageSize,
    //   skip: (this.currentPage * this.pageSize)
    // });
    this.fetch({
      success: (opts ? opts.success : null),
      error: (opts ? opts.error : null),
      options: {
        query: {
          limit: this.pageSize,
          skip: (this.currentPage * this.pageSize)
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

module.exports = Base;
