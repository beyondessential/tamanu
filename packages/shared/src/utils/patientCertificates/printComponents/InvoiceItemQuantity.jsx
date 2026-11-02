import { useLanguageContext } from '../../pdf/languageContext';
import { getDrugUnitLabel } from '../../medication';

// Reads the language context itself so the dispensing unit can be pluralised
// without threading getEnumTranslation through the shared formatters object.
export const InvoiceItemQuantity = ({ quantity, dispensingUnit }) => {
  const { getEnumTranslation } = useLanguageContext();
  if (!dispensingUnit) return quantity != null ? String(quantity) : '';
  return `${quantity} ${getDrugUnitLabel(dispensingUnit, quantity, getEnumTranslation)}`;
};
