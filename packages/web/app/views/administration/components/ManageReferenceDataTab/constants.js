import { REFERENCE_TYPE_VALUES, OTHER_REFERENCE_TYPE_VALUES } from '@tamanu/constants';
import { startCase } from 'lodash';

export const ENDPOINT = 'admin/referenceData/manage';
export const COLUMNS_ENDPOINT = 'admin/referenceData/manage/columns';

const MANAGEABLE_DATA_TYPES = [...REFERENCE_TYPE_VALUES, ...OTHER_REFERENCE_TYPE_VALUES].sort();

export const DATA_TYPE_OPTIONS = MANAGEABLE_DATA_TYPES.map(value => ({
  value,
  label: startCase(value),
}));
