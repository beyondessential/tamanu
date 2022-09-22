import { Sequelize } from 'sequelize';
import array from 'postgres-array';


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
