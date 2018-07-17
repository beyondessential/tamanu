import shortid from 'shortid';
import { defaults } from 'lodash';
import BaseModel from './base';

export default BaseModel.extend({
  defaults: () => defaults(
    {
      _id: `survey_${shortid.generate()}`,
      docType: 'survey',
      name: null,
      code: null,
      imageData: null,
      permissionGroupId: null,
      surveyGroupId: null,
    },
    BaseModel.prototype.defaults,
  )
});
