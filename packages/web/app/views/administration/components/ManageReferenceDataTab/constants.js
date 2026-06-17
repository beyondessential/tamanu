import { MANAGEABLE_REFERENCE_DATA_TYPES } from '@tamanu/constants';
import { startCase } from 'lodash-es';

export const ENDPOINT = 'admin/referenceData/manage';
export const COLUMNS_ENDPOINT = 'admin/referenceData/manage/columns';

export const DATA_TYPE_OPTIONS = [...MANAGEABLE_REFERENCE_DATA_TYPES].sort().map(value => ({
  value,
  label: startCase(value),
}));

export const REQUIRED_FIELDS = new Set(['id', 'code', 'name']);

export const SUGGESTER_FORMATTER = ({ name, id }) => ({ label: `${name} (${id})`, value: id });
export const SUGGESTER_OPTIONS = { formatter: SUGGESTER_FORMATTER };
