import { describe, it } from 'vitest';
import { STOCK_STATUSES } from '@tamanu/constants';
import {
  buildInstructionText,
  getStockStatus,
} from '../../../app/components/Medication/DispenseMedicationWorkflowModal';

const getTranslation = (_stringId, fallback) => fallback;
const getEnumTranslation = (labels, value) => labels?.[value] ?? value;

describe('DispenseMedicationWorkflowModal helpers', () => {
  describe('buildInstructionText', () => {
    it('builds an instruction string and omits missing optional fields', () => {
      const prescription = {
        doseAmount: 2,
        units: 'mg',
        frequency: 'Daily',
        route: 'oral',
        durationValue: 5,
        durationUnit: 'days',
        indication: 'Pain',
        notes: 'Take with food',
        isVariableDose: false,
      };

      const out = buildInstructionText(prescription, getTranslation, getEnumTranslation);
      expect(out).toContain('2');
      expect(out).toContain('mg');
      expect(out).toContain('Daily');
      expect(out).toContain('Oral');
      expect(out).toContain('5 day');
      expect(out).toContain('for Pain');
      expect(out).toContain('Take with food');
      expect(out.endsWith('.')).toBe(true);
    });

    it('returns empty string if no prescription', () => {
      expect(buildInstructionText(null, getTranslation, getEnumTranslation)).toBe('');
    });
  });

  describe('getStockStatus', () => {
    it('returns unknown when stock is missing', () => {
      expect(getStockStatus(null)).toBe(STOCK_STATUSES.UNKNOWN);
      expect(getStockStatus(undefined)).toBe(STOCK_STATUSES.UNKNOWN);
    });

    it('returns no when quantity is 0', () => {
      expect(getStockStatus({ quantity: 0 })).toBe(STOCK_STATUSES.NO);
    });

    it('returns yes when quantity is positive', () => {
      expect(getStockStatus({ quantity: 3 })).toBe(STOCK_STATUSES.YES);
    });
  });
});

