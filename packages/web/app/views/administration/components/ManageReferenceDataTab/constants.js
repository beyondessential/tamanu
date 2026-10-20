import { MANAGEABLE_REFERENCE_DATA_TYPES } from '@tamanu/constants';
import { startCase } from 'es-toolkit/compat';

export const ENDPOINT = 'admin/referenceData/manage';
export const COLUMNS_ENDPOINT = 'admin/referenceData/manage/columns';

export const DATA_TYPE_OPTIONS = MANAGEABLE_REFERENCE_DATA_TYPES.toSorted().map(value => ({
  value,
  label: startCase(value),
}));

export const REQUIRED_FIELDS = new Set(['id', 'code', 'name']);

// A DB default only applies on insert, so a NOT NULL column with a default can be left blank when
// adding, but must keep a value when editing.
export const isFieldRequired = (col, { isEditMode }) =>
  REQUIRED_FIELDS.has(col.key) || (!col.allowNull && (isEditMode || !col.hasDefault));

export const SUGGESTER_FORMATTER = ({ name, id }) => ({ label: `${name} (${id})`, value: id });
export const SUGGESTER_OPTIONS = { formatter: SUGGESTER_FORMATTER };

// Search bar fields sit over columns that display raw ids, so they search on and display the
// id alone — unlike the create/edit form, which searches by name.
export const ID_SEARCH_SUGGESTER_OPTIONS = {
  formatter: ({ id }) => ({ label: id, value: id }),
  baseQueryParameters: { searchById: true },
};
