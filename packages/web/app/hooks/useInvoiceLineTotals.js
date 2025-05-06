import { useMemo } from 'react';
import {
  calculateInvoiceLinesDiscountableTotal,
  calculateInvoiceLinesNonDiscountableTotal,
} from '../utils';

export const useInvoiceLineTotals = (lines) => {
  const discountableTotal = useMemo(() => {
    return calculateInvoiceLinesDiscountableTotal(lines);
  }, [lines]);
  const nonDiscountableTotal = useMemo(() => {
    return calculateInvoiceLinesNonDiscountableTotal(lines);
  }, [lines]);

  return { discountableTotal, nonDiscountableTotal };
};
