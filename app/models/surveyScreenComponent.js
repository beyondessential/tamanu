import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `surveyScrnCompt_${shortid.generate()}`,
      docType: 'surveyScrnCompt',
      questionId: null,
      screenId: null,
      componentNumber: null,
      nswersEnablingFollowUp: null,
      isFollowUp: false,
    },
    BaseModel.prototype.defaults,
  )
});
