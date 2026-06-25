import { INVOICE_ITEMS_CATEGORIES, INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES } from '@tamanu/constants';
import { productMatrixByCodeLoaderFactory } from './ProductMatrixByCodeLoaderFactory';

const { HIDDEN, FIXED_PREFIX, FIXED_COLUMN_TOKEN } = INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES;

export function invoicePriceListItemLoaderFactory() {
  return productMatrixByCodeLoaderFactory({
    parentModel: 'InvoicePriceList',
    itemModel: 'InvoicePriceListItem',
    parentIdField: 'invoicePriceListId',
    valueField: 'price',
    // Code-first: try the whole header as a price-list code, falling back to a `:fixed`-stripped
    // code that marks the column fixed-by-default. The literal header always wins, so the token
    // can never collide with a real code.
    headerResolver: rawHeader => {
      const candidates = [{ code: rawHeader, columnMeta: { fixedByDefault: false } }];
      if (rawHeader.toLowerCase().endsWith(FIXED_COLUMN_TOKEN)) {
        candidates.push({
          code: rawHeader.slice(0, -FIXED_COLUMN_TOKEN.length),
          columnMeta: { fixedByDefault: true },
        });
      }
      return candidates;
    },
    valueExtractor: (value, isEmpty, columnMeta = {}, product) => {
      if (isEmpty) {
        return { parsedValue: null, isValidValue: true, isHidden: false, isFixedPrice: false };
      }

      const raw = `${value}`.trim();
      if (raw === HIDDEN) {
        return { parsedValue: null, isValidValue: true, isHidden: true, isFixedPrice: false };
      }

      // Fixed pricing is only supported for medications. An explicit `f` marker on a
      // non-medication is rejected; a column-level `:fixed` default simply doesn't apply to
      // non-medications (the plain number is imported as a per-unit price).
      const isMedication = product?.category === INVOICE_ITEMS_CATEGORIES.DRUG;
      const hasPrefix = raw.toLowerCase().startsWith(FIXED_PREFIX);

      if (hasPrefix && !isMedication) {
        return {
          parsedValue: null,
          isValidValue: false,
          errorMessage: `Fixed price '${value}' is only supported for medications, but invoiceProductId '${product?.id}' is not a medication`,
        };
      }

      const numericPart = hasPrefix ? raw.slice(FIXED_PREFIX.length).trim() : raw;
      const isFixedPrice = isMedication && (hasPrefix || Boolean(columnMeta.fixedByDefault));

      const parsedValue = Number(numericPart);
      const isValidValue = numericPart !== '' && Number.isFinite(parsedValue);
      return { parsedValue, isValidValue, isHidden: false, isFixedPrice };
    },
    allowEmptyValues: true,
    messages: {
      duplicateCode: code => `duplicate price list code: ${code}`,
      missingParentByCode: code => `InvoicePriceList with code '${code}' does not exist`,
      invalidValue: (raw, code, invoiceProductId) =>
        `Invalid price value '${raw}' for priceList '${code}' and invoiceProductId '${invoiceProductId}'`,
    },
  });
}
