import { OTHER_REFERENCE_TYPES, REFERENCE_TYPES } from '@tamanu/constants';

import { getReferenceDataStringId } from '../translation/getReferenceDataStringId';

// Only the regular column stands in for "no diet recorded", so only it may carry the Regular
// label. A column with no resolvable name is labelled as unknown rather than folded into
// Regular, which would hide a real diet behind a heading the kitchen cooks to.
const resolveColumnLabel = (column, getTranslation) => {
  if (column.name) {
    return getTranslation(getReferenceDataStringId(column.key, REFERENCE_TYPES.DIET), column.name);
  }
  return column.isRegular
    ? getTranslation('pdf.dietSummary.regularDiet', 'Regular')
    : getTranslation('pdf.dietSummary.unknownDiet', 'Unknown diet');
};

const resolveWardName = (area, getTranslation) =>
  area.id
    ? getTranslation(
        getReferenceDataStringId(area.id, OTHER_REFERENCE_TYPES.LOCATION_GROUP),
        area.name,
      )
    : getTranslation('pdf.dietSummary.noArea', 'No area');

// Resolves the labels the sheet prints and the order it prints them in.
//
// The server orders columns and wards against the source-language reference data names, so a
// deployment carrying reference data translations needs its own order resolved against the names
// actually printed, rather than inheriting the server's order as-is.
//
// spec: DIETSUM#layout, DIETSUM#diet-columns-and-counting
export const prepareDietSummary = ({ columns = [], areas = [], getTranslation }) => {
  const dietColumns = columns
    .map((column) => ({
      key: column.key,
      label: resolveColumnLabel(column, getTranslation),
      isRegular: Boolean(column.isRegular),
    }))
    .sort((a, b) => {
      if (a.isRegular !== b.isRegular) return a.isRegular ? -1 : 1;
      return a.label.localeCompare(b.label);
    });

  const wardSections = areas
    .map((area) => ({ area, wardName: resolveWardName(area, getTranslation) }))
    .sort((a, b) => {
      const aHasArea = Boolean(a.area.id);
      const bHasArea = Boolean(b.area.id);
      if (aHasArea !== bHasArea) return aHasArea ? -1 : 1;
      return a.wardName.localeCompare(b.wardName);
    });

  return { dietColumns, wardSections };
};
