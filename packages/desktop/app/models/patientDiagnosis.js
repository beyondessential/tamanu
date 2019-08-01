import Backbone from 'backbone-associations';
import { defaults, clone, isEmpty } from 'lodash';
import * as Yup from 'yup';
import moment from 'moment';
import BaseModel from './base';
import { register } from './register';

export default register(
  'PatientDiagnosis',
  BaseModel.extend({
    urlRoot: `${BaseModel.prototype.urlRoot}/patientDiagnosis`,
    defaults: () =>
      defaults(
        {
          active: true,
          date: moment(),
          diagnosis: null,
          secondaryDiagnosis: false,
          certainty: null,
          condition: null,
        },
        BaseModel.prototype.defaults,
      ),

    relations: [
      {
        type: Backbone.One,
        key: 'diagnosis',
        relatedModel: 'Diagnosis',
      },
      {
        type: Backbone.One,
        key: 'condition',
        relatedModel: 'Condition',
      },
      ...BaseModel.prototype.relations,
    ],

    hasOngoingCondition() {
      const { condition } = this.toJSON();
      return !isEmpty(condition);
    },

    parse(response) {
      return { ...response, date: moment(response.date) };
    },

    validationSchema: Yup.object().shape({
      diagnosis: Yup.mixed().required('is required'),
      date: Yup.date().required('is required'),
      certainty: Yup.mixed().required('is required'),
    }),
  }),
);
