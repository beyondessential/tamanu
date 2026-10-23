import { MANAGEABLE_REFERENCE_DATA_TYPES } from '@tamanu/constants';
import { startCase } from 'es-toolkit/compat';

export const ENDPOINT = 'admin/referenceData/manage';
export const COLUMNS_ENDPOINT = 'admin/referenceData/manage/columns';

export const DATA_TYPE_OPTIONS = MANAGEABLE_REFERENCE_DATA_TYPES.toSorted().map(value => ({
  value,
  label: startCase(value),
}));

export const REQUIRED_FIELDS = new Set(['id', 'code', 'name']);

// Column types that render as a NumberField, and so reach the server as '' once cleared. Postgres
// rejects '' for these, unlike a text column where it is a value in its own right.
export const NUMERIC_COLUMN_TYPES = new Set(['INTEGER', 'FLOAT', 'DOUBLE', 'DECIMAL', 'REAL']);

// A DB default only applies on insert, so on edit a NOT NULL column has to keep a value. Only the
// numeric ones are required: clearing a NOT NULL text column writes '', which it accepts, and a
// checkbox always holds a value.
export const isFieldRequired = (col, { isEditMode }) =>
  REQUIRED_FIELDS.has(col.key) ||
  (!col.allowNull && (!col.hasDefault || (isEditMode && NUMERIC_COLUMN_TYPES.has(col.type))));

export const SUGGESTER_FORMATTER = ({ name, id }) => ({ label: `${name} (${id})`, value: id });
export const SUGGESTER_OPTIONS = { formatter: SUGGESTER_FORMATTER };

// Search bar fields sit over columns that display raw ids, so they search on and display the
// id alone — unlike the create/edit form, which searches by name.
export const ID_SEARCH_SUGGESTER_OPTIONS = {
  formatter: ({ id }) => ({ label: id, value: id }),
  baseQueryParameters: { searchById: true },
};
