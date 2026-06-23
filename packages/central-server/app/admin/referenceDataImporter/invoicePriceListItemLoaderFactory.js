import { INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES } from '@tamanu/constants';
import { productMatrixByCodeLoaderFactory } from './ProductMatrixByCodeLoaderFactory';

const { HIDDEN, FIXED_HEADER_TOKEN, FIXED_CELL_PREFIX } = INVOICE_PRICE_LIST_ITEM_IMPORT_VALUES;

const FIXED_HEADER_PATTERN = new RegExp(`^${FIXED_HEADER_TOKEN}\\s+`, 'i');
const FIXED_CELL_PATTERN = new RegExp(`^${FIXED_CELL_PREFIX}`, 'i');

function parsePriceListHeader(rawHeader) {
  const trimmed = String(rawHeader).trim();
  const isFixedDefault = FIXED_HEADER_PATTERN.test(trimmed);
  const code = isFixedDefault ? trimmed.replace(FIXED_HEADER_PATTERN, '').trim() : trimmed;
  return { code, isFixedDefault };
}

function extractPriceListCellValue(value, { isEmpty, headerMeta }) {
  if (isEmpty) {
    return { parsedValue: null, isValidValue: true, isHidden: false, isFixedPrice: false };
  }

  const trimmed = String(value).trim();
  if (trimmed.toLowerCase() === HIDDEN) {
    return { parsedValue: null, isValidValue: true, isHidden: true, isFixedPrice: false };
  }

  const hasCellPrefix = FIXED_CELL_PATTERN.test(trimmed);
  const numericPart = hasCellPrefix ? trimmed.slice(FIXED_CELL_PREFIX.length).trim() : trimmed;
  const parsedValue = Number(numericPart);
  const isValidValue = numericPart !== '' && !Number.isNaN(parsedValue);
  const isFixedPrice = isValidValue && (hasCellPrefix || Boolean(headerMeta?.isFixedDefault));

  return { parsedValue, isValidValue, isHidden: false, isFixedPrice };
}

export function invoicePriceListItemLoaderFactory() {
  return productMatrixByCodeLoaderFactory({
    parentModel: 'InvoicePriceList',
    itemModel: 'InvoicePriceListItem',
    parentIdField: 'invoicePriceListId',
    valueField: 'price',
    headerParser: parsePriceListHeader,
    valueExtractor: extractPriceListCellValue,
    allowEmptyValues: true,
    messages: {
      duplicateCode: code => `duplicate price list code: ${code}`,
      missingParentByCode: code => `InvoicePriceList with code '${code}' does not exist`,
      couldNotFindParentId: code => `Could not find InvoicePriceList ID for code '${code}'`,
      invalidValue: (raw, code, invoiceProductId) =>
        `Invalid price value '${raw}' for priceList '${code}' and invoiceProductId '${invoiceProductId}'`,
    },
  });
}
