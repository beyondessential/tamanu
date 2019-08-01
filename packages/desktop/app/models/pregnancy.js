import Backbone from 'backbone-associations';
import * as Yup from 'yup';
import moment from 'moment';
import BaseModel from './base';
import { register } from './register';

export default register(
  'Pregnancy',
  BaseModel.extend({
    urlRoot: `${BaseModel.prototype.urlRoot}/pregnancy`,
    defaults: () => ({
      ...BaseModel.prototype.defaults,
      conceiveDate: moment(), // estimated
      deliveryDate: null, // estimated
      child: null,
      father: null, // biological father
      outcome: '',
      gestationalAge: '',
      surveyResponses: [],
    }),

    relations: [
      {
        type: Backbone.One,
        key: 'child',
        relatedModel: 'Patient',
      },
      {
        type: Backbone.One,
        key: 'father',
        relatedModel: 'Patient',
      },
      {
        type: Backbone.Many,
        key: 'surveyResponses',
        relatedModel: 'SurveyResponse',
      },
      ...BaseModel.prototype.relations,
    ],

    validationSchema: Yup.object().shape({
      conceiveDate: Yup.date().required('is required'),
    }),
  }),
);
