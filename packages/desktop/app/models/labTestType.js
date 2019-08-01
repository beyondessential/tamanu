import Backbone from 'backbone-associations';
import { defaults } from 'lodash';
import BaseModel from './base';
import { register } from './register';

export default register(
  'LabTestType',
  BaseModel.extend({
    urlRoot: `${BaseModel.prototype.urlRoot}/labTestType`,
    defaults: () =>
      defaults(
        {
          name: null,
          category: null,
          femaleRange: null,
          maleRange: null,
          unit: null,
          questionType: null,
          options: [],
          sortOrder: 0,
        },
        BaseModel.prototype.defaults,
      ),

    // Associations
    relations: [
      {
        type: Backbone.One,
        key: 'category',
        relatedModel: 'LabTestCategory',
      },
      ...BaseModel.prototype.relations,
    ],
  }),
);
