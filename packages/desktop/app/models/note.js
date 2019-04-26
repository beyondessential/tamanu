import { defaults, isEmpty } from 'lodash';
import * as Yup from 'yup';
import moment from 'moment';
import BaseModel from './base';
import { register } from './register';

export default register('Note', BaseModel.extend({
  urlRoot: `${BaseModel.prototype.urlRoot}/note`,
  defaults: () => defaults({
    attribution: '',
    content: '',
    createdBy: '',
    date: moment(),
    noteType: '',
  },
  BaseModel.prototype.defaults),

  validationSchema: Yup.object().shape({
    content: Yup.string().required('is required'),
  }),

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
}));
