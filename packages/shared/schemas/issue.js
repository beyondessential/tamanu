import { parseInt, padStart } from 'lodash';
import defaults from './defaults';
import { DISPLAY_ID_PLACEHOLDER, ENVIRONMENT_TYPE } from '../constants';

export const IssueSchema = {
  name: 'issue',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    type: 'string',
    date: 'date',
    notes: 'string',
    ...defaults,
  },
};
