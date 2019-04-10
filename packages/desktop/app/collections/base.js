import Backbone from 'backbone-associations';
import 'backbone.paginator';

export default Backbone.PageableCollection.extend({
  url: `${process.env.HOST}${process.env.REALM_PATH}`,
  state: {
    firstPage: 0,
    currentPage: 0,
    pageSize: 10,
  },

  filters: {
    keyword: '',
    fields: [],
  },

  queryParams: {
    currentPage: 'current_page',
    pageSize: 'page_size',
  },

  fetch({ data, ...options } = {}) {
    const { keyword, fields } = this.filters;
    const newOptions = { ...options, data: { ...data, keyword, fields: fields.join(',') } };
    return Backbone.PageableCollection.prototype.fetch.apply(this, [newOptions]);
  },

  /**
   * Helper method to fetch all results from the server without using pagination
   */
  fetchAll({ data, ...options } = {}) {
    return this.fetch({ ...options, data: { ...data, page_size: 9999 } });
  },

  /**
   * Set keyword for the collection that will be sent to the server for filtering
   *
   * @param {String} keyword keyword used for filtering
   * @param {[]} fields array of fields that will be searched for this keyword
   */
  setKeyword(keyword, fields = null) {
    this.filters = {
      keyword,
      fields: fields || this.filters.fields,
    };
    return this;
  },

  /**
   * Shorthand method to fetch a single page from the server
   */
  getPage(page, options = {}) {
    const { pageSize } = options;
    if (pageSize) this.state.pageSize = pageSize;
    return Backbone.PageableCollection.prototype.getPage.apply(this, [page, options]);
  },
});
