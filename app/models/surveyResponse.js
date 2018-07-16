import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `surveyResp_${shortid.generate()}`,
      type: 'surveyResp',
      surveyId: null,
      userId: null,
      assessorName: null,
      clinicId: null,
      startTime: null,
      endTime: null,
      metadata: null,
    },
    BaseModel.prototype.defaults,
  )
});
