import { MAX_REPEATS } from '@tamanu/constants';

import {
  DISCHARGE_MEDICATIONS_SCHEMA,
  DISPENSING_QUANTITY_SCHEMA,
  REPEATS_SCHEMA,
} from '../app/routes/apiv1/medicationValidationSchema';

// The prescription and discharge forms both let a dispensing quantity be left blank, and a blank
// number input arrives as an empty string. Every spelling of "nothing entered" has to land as zero:
// the column is an integer, so an empty string would otherwise fail Sequelize's own validation
// midway through the discharge transaction, taking the whole discharge down with it.
describe('dispensing quantity normalisation', () => {
  describe('DISPENSING_QUANTITY_SCHEMA', () => {
    it.each([['', 'an empty string'], [null, 'null'], [undefined, 'undefined']])(
      'records %p (%s) as zero',
      quantity => {
        expect(DISPENSING_QUANTITY_SCHEMA.parse(quantity)).toBe(0);
      },
    );

    it('keeps a quantity that was entered', () => {
      expect(DISPENSING_QUANTITY_SCHEMA.parse(5)).toBe(5);
    });

    it('accepts a numeric string, as sent by a number input', () => {
      expect(DISPENSING_QUANTITY_SCHEMA.parse('5')).toBe(5);
    });

    it('rejects a negative quantity', () => {
      expect(() => DISPENSING_QUANTITY_SCHEMA.parse(-1)).toThrow();
    });

    it('rejects a non-numeric quantity rather than silently zeroing it', () => {
      expect(() => DISPENSING_QUANTITY_SCHEMA.parse('abc')).toThrow();
    });
  });

  describe('REPEATS_SCHEMA', () => {
    it.each([['', 'an empty string'], [null, 'null'], [undefined, 'undefined']])(
      'records %p (%s) as zero',
      repeats => {
        expect(REPEATS_SCHEMA.parse(repeats)).toBe(0);
      },
    );

    it('rejects more repeats than are allowed', () => {
      expect(() => REPEATS_SCHEMA.parse(MAX_REPEATS + 1)).toThrow();
    });
  });

  describe('DISCHARGE_MEDICATIONS_SCHEMA', () => {
    it('normalises a blank row without dropping the medication', () => {
      expect(
        DISCHARGE_MEDICATIONS_SCHEMA.parse({
          'medication-1': { quantity: '', repeats: '', sendToPharmacy: false },
        }),
      ).toEqual({
        'medication-1': { quantity: 0, repeats: 0, sendToPharmacy: false },
      });
    });

    it('records a row that omits its quantity and repeats entirely as zero', () => {
      expect(DISCHARGE_MEDICATIONS_SCHEMA.parse({ 'medication-1': {} })).toEqual({
        'medication-1': { quantity: 0, repeats: 0 },
      });
    });

    it('keeps the quantities of the rows being sent to pharmacy', () => {
      expect(
        DISCHARGE_MEDICATIONS_SCHEMA.parse({
          'medication-1': { quantity: '', repeats: '0', sendToPharmacy: false },
          'medication-2': { quantity: 2, repeats: 1, sendToPharmacy: true },
        }),
      ).toEqual({
        'medication-1': { quantity: 0, repeats: 0, sendToPharmacy: false },
        'medication-2': { quantity: 2, repeats: 1, sendToPharmacy: true },
      });
    });

    it('accepts an empty table', () => {
      expect(DISCHARGE_MEDICATIONS_SCHEMA.parse({})).toEqual({});
    });
  });
});
