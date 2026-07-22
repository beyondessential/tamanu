import { MANAGEABLE_REFERENCE_DATA_TYPES } from '@tamanu/constants';
import { startCase } from 'lodash';

export const ENDPOINT = 'admin/referenceData/manage';
export const COLUMNS_ENDPOINT = 'admin/referenceData/manage/columns';

export const DATA_TYPE_OPTIONS = [...MANAGEABLE_REFERENCE_DATA_TYPES].sort().map(value => ({
  value,
  label: startCase(value),
}));

export const REQUIRED_FIELDS = new Set(['id', 'code', 'name']);

export const SUGGESTER_FORMATTER = ({ name, id }) => ({ label: `${name} (${id})`, value: id });
export const SUGGESTER_OPTIONS = { formatter: SUGGESTER_FORMATTER };

// Search bar fields sit over columns that display raw ids, so they search on and display the
// id alone — unlike the create/edit form, which searches by name.
export const ID_SEARCH_SUGGESTER_OPTIONS = {
  formatter: ({ id }) => ({ label: id, value: id }),
  baseQueryParameters: { searchById: true },
};
