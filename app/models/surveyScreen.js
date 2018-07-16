import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `surveyScrn_${shortid.generate()}`,
      type: 'surveyScrn',
      surveyId: null,
      screenNumber: null,
    },
    BaseModel.prototype.defaults,
  )
});
