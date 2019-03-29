import defaults from './defaults';
import { LAB_REQUEST_STATUSES } from '../constants';

export const LabTestSchema = {
  name: 'labTest',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    type: 'labTestType',
    result: 'string?',
    senaiteId: 'string?',
    status: { type: 'string', default: LAB_REQUEST_STATUSES.RECEPTION_PENDING },
    ...defaults,
  },
};
