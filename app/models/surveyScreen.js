import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `surveyScrn_${shortid.generate()}`,
      docType: 'surveyScrn',
      surveyId: null,
      screenNumber: null,
    },
    BaseModel.prototype.defaults,
  )
});
