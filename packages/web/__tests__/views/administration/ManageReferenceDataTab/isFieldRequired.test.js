import { describe, expect, it } from 'vitest';
import { isFieldRequired } from '../../../../app/views/administration/components/ManageReferenceDataTab/constants';

const column = overrides => ({
  key: 'someField',
  type: 'STRING',
  allowNull: true,
  hasDefault: false,
  ...overrides,
});

describe('isFieldRequired', () => {
  it.each(['id', 'code', 'name'])('always requires %s', key => {
    const col = column({ key, allowNull: true, hasDefault: true });
    expect(isFieldRequired(col, { isEditMode: false })).toBe(true);
    expect(isFieldRequired(col, { isEditMode: true })).toBe(true);
  });

  it('never requires a nullable column', () => {
    const col = column({ allowNull: true, hasDefault: false });
    expect(isFieldRequired(col, { isEditMode: false })).toBe(false);
    expect(isFieldRequired(col, { isEditMode: true })).toBe(false);
  });

  it('requires a NOT NULL column with no default, on both add and edit', () => {
    const col = column({ allowNull: false, hasDefault: false });
    expect(isFieldRequired(col, { isEditMode: false })).toBe(true);
    expect(isFieldRequired(col, { isEditMode: true })).toBe(true);
  });

  describe('NOT NULL with a default', () => {
    // The default only applies on insert, so on edit the value has to be kept — but only where
    // the column cannot hold the '' a cleared field submits.
    it.each(['INTEGER', 'FLOAT', 'DOUBLE', 'DECIMAL', 'REAL'])(
      'is optional on add and required on edit for %s',
      type => {
        const col = column({ type, allowNull: false, hasDefault: true });
        expect(isFieldRequired(col, { isEditMode: false })).toBe(false);
        expect(isFieldRequired(col, { isEditMode: true })).toBe(true);
      },
    );

    it.each(['STRING', 'TEXT', 'BOOLEAN', 'ENUM'])('stays optional for %s', type => {
      const col = column({ type, allowNull: false, hasDefault: true });
      expect(isFieldRequired(col, { isEditMode: false })).toBe(false);
      expect(isFieldRequired(col, { isEditMode: true })).toBe(false);
    });
  });
});
