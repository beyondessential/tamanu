import shortid from 'shortid';
import moment from 'moment';
import BaseModel from './base';

export default BaseModel.extend({
  idAttribute: '_id',
  defaults: () => {
    return {
      _id: `medicationHistory_${shortid.generate()}`,
      docType: 'medicationHistory',
      date: moment(),
      morning: false,
      lunch: false,
      evening: false,
      night: false,
      markedBy: '',
    };
  },
});
