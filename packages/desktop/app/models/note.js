import { defaults, isEmpty } from 'lodash';
import moment from 'moment';
import BaseModel from './base';

export default BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/note`,
  defaults: () => defaults({
    attribution: '',
    content: '',
    createdBy: '',
    date: moment(),
    noteType: '',
  },
  BaseModel.prototype.defaults),

  authoredBy() {
    if (!isEmpty(this.get('attribution'))) {
      return `${this.get('createdBy')} on behalf of ${this.get('attribution')}`;
    }
    return this.get('createdBy');
  },

  toJSON() {
    const oldFunc = BaseModel.prototype.toJSON.bind(this);
    const json = oldFunc();
    json.authoredBy = this.authoredBy();
    return json;
  },

  validate: (attrs) => {
    if (!attrs.content) return "note's text is required!";
  },
});
