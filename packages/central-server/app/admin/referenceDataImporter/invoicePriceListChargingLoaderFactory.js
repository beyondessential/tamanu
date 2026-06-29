import { INVOICE_ITEMS_CATEGORIES, INVOICE_PRICE_LIST_CHARGING_VALUES } from '@tamanu/constants';
import { productMatrixByCodeLoaderFactory } from './ProductMatrixByCodeLoaderFactory';

const { FLAT_FEE, PER_UNIT } = INVOICE_PRICE_LIST_CHARGING_VALUES;
const FLAT_FEE_LOWER = FLAT_FEE.toLowerCase();
const PER_UNIT_LOWER = PER_UNIT.toLowerCase();

// Imports the "Invoice Price List Charging" sheet — the charging type per (product × price list),
// keyed identically to the price sheet. It sets `isFixedPrice` on the matching InvoicePriceListItem
// (created by the price sheet, which this depends on), so the two sheets merge onto the same row.
export function invoicePriceListChargingLoaderFactory() {
  return productMatrixByCodeLoaderFactory({
    parentModel: 'InvoicePriceList',
    itemModel: 'InvoicePriceListItem',
    parentIdField: 'invoicePriceListId',
    valueField: 'isFixedPrice',
    // Every cell must be an explicit flatFee/perUnit; blanks are an error. Fixed pricing (flatFee)
    // is only valid for medications.
    valueExtractor: (value, isEmpty, product) => {
      if (isEmpty) {
        return {
          parsedValue: null,
          isValidValue: false,
          errorMessage: `Charging type is required (flatFee or perUnit) for invoiceProductId '${product?.id}'`,
        };
      }

      const raw = `${value}`.trim().toLowerCase();
      if (raw !== FLAT_FEE_LOWER && raw !== PER_UNIT_LOWER) {
        return { parsedValue: null, isValidValue: false };
      }

      const isFixedPrice = raw === FLAT_FEE_LOWER;
      if (isFixedPrice && product?.category !== INVOICE_ITEMS_CATEGORIES.DRUG) {
        return {
          parsedValue: null,
          isValidValue: false,
          errorMessage: `'${FLAT_FEE}' charging is only supported for medications, but invoiceProductId '${product?.id}' is not a medication`,
        };
      }

      return { parsedValue: isFixedPrice, isValidValue: true };
    },
    // Require a value in every cell (blank -> error via the extractor above).
    allowEmptyValues: true,
    messages: {
      duplicateCode: code => `duplicate price list code: ${code}`,
      missingParentByCode: code => `InvoicePriceList with code '${code}' does not exist`,
      couldNotFindParentId: code => `Could not find InvoicePriceList ID for code '${code}'`,
      invalidValue: (raw, code, invoiceProductId) =>
        `Invalid charging type '${raw}' for priceList '${code}' and invoiceProductId '${invoiceProductId}' (expected '${FLAT_FEE}' or '${PER_UNIT}')`,
    },
  });
}
