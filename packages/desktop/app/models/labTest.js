import Backbone from 'backbone-associations';
import shortid from 'shortid';
import BaseModel from './base';
import { register } from './register';

export default register(
  'LabTest',
  BaseModel.extend({
    urlRoot: `${BaseModel.prototype.urlRoot}/labTest`,
    defaults: () => ({
      _id: shortid.generate(),
      type: null,
      result: null,
      ...BaseModel.prototype.defaults,
    }),

    // Associations
    relations: [
      {
        type: Backbone.One,
        key: 'type',
        relatedModel: 'LabTestType',
      },
      ...BaseModel.prototype.relations,
    ],
  }),
);
