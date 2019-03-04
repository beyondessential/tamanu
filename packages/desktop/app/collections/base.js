import Backbone from 'backbone-associations';
import { keys, set, isEmpty, isArray } from 'lodash';

require('backbone.paginator');

export default Backbone.PageableCollection.extend({
  url: `${process.env.HOST}${process.env.REALM_PATH}`,
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

  fetchAll(options = {}) {
    return this.fetch({ ...options, data: { page_size: 9999 } });
  },

  fetchResults(opts = {}) {
    const { model: Model } = this;
    const model = new Model();
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
    const { view, keys: viewKeys } = opts;
    const options = {
      data: {
        ...opts,
        view,
        keys: isArray(viewKeys) ? viewKeys.join(',') : viewKeys,
      }
    };

    return this.fetch(options);
  },

  find(opts = {}) {
    const { model: Model } = this;
    const model = new Model();
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

  setKeyword(keyword, fields = null) {
    this.filters = {
      keyword,
      fields: fields || this.filters.fields,
    };
    return this;
  },

  getPage(page, view, viewKeys, options = {}) {
    const { pageSize } = options;
    if (pageSize) this.state.pageSize = pageSize;
    if (view) set(options, 'data.view', view);
    if (viewKeys) set(options, 'data.keys', isArray(viewKeys) ? viewKeys.join(',') : viewKeys);
    return Backbone.PageableCollection.prototype.getPage.apply(this, [page, options]);
  },

  setPage(page) {
    console.log('-setPage-', page);
  }
});
