import { Sequelize } from 'sequelize';
import array from 'postgres-array';

import { FHIR_DATETIME_PRECISION, VISIBILITY_STATUSES } from '../../constants';
import { formatFhirDate } from '../../utils/fhir';

export function arrayOf(fieldName, Type, overrides = {}) {
  const entryType = typeof Type === 'function' ? new Type() : Type;
  return {
    type: Sequelize.ARRAY(Type),
    allowNull: false,
    defaultValue: [],
    get() {
      const original = this.getDataValue(fieldName);
      if (Array.isArray(original)) return original;
      return array.parse(original, entry => entryType._sanitize(entry));
    },
    ...overrides,
  };
}

export function activeFromVisibility(upstream) {
  switch (upstream.visibilityStatus) {
    case VISIBILITY_STATUSES.CURRENT:
      return !upstream.deletedAt;
    default:
      return false;
  }
}
