import { Sequelize } from 'sequelize';
import array from 'postgres-array';

import { VISIBILITY_STATUSES } from '../../constants';

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
  return (
    (upstream.visibilityStatus === VISIBILITY_STATUSES.CURRENT && !upstream.deletedAt) ||
    upstream.visibilityStatus === VISIBILITY_STATUSES.MERGED
  );
}
