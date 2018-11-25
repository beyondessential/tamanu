import Backbone from 'backbone-associations';
import { keys, set, isEmpty } from 'lodash';

require('backbone.paginator');

export default Backbone.PageableCollection.extend({
  url: process.env.LAN_REALM,
  state: {
    firstPage: 0,
    currentPage: 0,
    pageSize: 10
  },

  filters: {
    keyword: '',
    fields: [],
  },

  queryParams: {
    currentPage: "current_page",
    pageSize: "page_size"
  },

  fetch(options = {}) {
    const { keyword, fields } = this.filters;
    if (!options.data) options.data = {};
    if (keyword) {
      options.data.keyword = keyword;
      options.data.fields = fields.join(',');
    }
    return Backbone.PageableCollection.prototype.fetch.apply(this, [options]);
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
    const { view } = opts;
    const options = {
      data: { view, ...opts }
    };

    return this.fetch(options);
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

  setKeyword(keyword) {
    this.filters.keyword = keyword;
  },

  getPage(page, view, options) {
    if (!options) options = {};
    if (view) set(options, 'data.view', view);
    return Backbone.PageableCollection.prototype.getPage.apply(this, [page, options]);
  },

  setPage(page) {
    console.log('-setPage-', page);
  }
});
