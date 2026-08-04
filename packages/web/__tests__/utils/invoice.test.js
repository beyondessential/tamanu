import { describe, it, expect } from 'vitest';
import { INVOICE_ITEMS_CATEGORIES, INVOICE_ITEMS_CATEGORIES_MODELS } from '@tamanu/constants';
import { isZeroedBedFeeItem } from '../../app/utils/invoice';

const BED_FEE_SOURCE_TYPE = INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE];

describe('isZeroedBedFeeItem', () => {
  it('flags a bed-fee line reconciled to zero nights (a location the patient left)', () => {
    expect(isZeroedBedFeeItem({ sourceRecordType: BED_FEE_SOURCE_TYPE, quantity: 0 })).toBe(true);
    expect(isZeroedBedFeeItem({ sourceRecordType: BED_FEE_SOURCE_TYPE, quantity: '0' })).toBe(true);
  });

  it('keeps a bed-fee line that is still charging nights', () => {
    expect(isZeroedBedFeeItem({ sourceRecordType: BED_FEE_SOURCE_TYPE, quantity: 2 })).toBe(false);
  });

  it('keeps a $0-priced bed fee for a night the patient occupied (quantity 1)', () => {
    expect(isZeroedBedFeeItem({ sourceRecordType: BED_FEE_SOURCE_TYPE, quantity: 1 })).toBe(false);
  });

  it('keeps a non-bed-fee line regardless of quantity', () => {
    expect(isZeroedBedFeeItem({ sourceRecordType: 'ReferenceData', quantity: 0 })).toBe(false);
  });

  it('handles missing or empty items', () => {
    expect(isZeroedBedFeeItem(undefined)).toBe(false);
    expect(isZeroedBedFeeItem(null)).toBe(false);
    expect(isZeroedBedFeeItem({})).toBe(false);
  });
});
