import React from 'react';
import * as yup from 'yup';
import { TranslatedText } from '@tamanu/ui-components';

const REQUIRED_MESSAGE = (
  <TranslatedText
    stringId="validation.required.inline"
    fallback="*Required"
    data-testid="translatedtext-validation-required"
  />
);

// Invoice item rows are autofilled with date, quantity and ordered-by clinician. A row only counts
// as intentionally edited once the user sets a product or a manual price; ordered-by is excluded
// because it's prefilled. != null keeps legitimate falsy values like manualEntryPrice=0 as input.
const hasUserEnteredData = ({ productId, manualEntryPrice }) =>
  productId != null || manualEntryPrice != null;

export const invoiceFormSchema = yup.object({
  invoiceItems: yup.array(
    yup.object().shape({
      orderDate: yup.string().required(REQUIRED_MESSAGE),
      productId: yup.string().when('manualEntryPrice', {
        is: manualEntryPrice => hasUserEnteredData({ manualEntryPrice }),
        then: schema => schema.required(REQUIRED_MESSAGE),
        otherwise: schema => schema.nullable(),
      }),
      orderedByUserId: yup.string().when(['productId', 'manualEntryPrice'], {
        is: (productId, manualEntryPrice) =>
          hasUserEnteredData({ productId, manualEntryPrice }),
        then: schema => schema.required(REQUIRED_MESSAGE),
        otherwise: schema => schema.nullable(),
      }),
      quantity: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .required(REQUIRED_MESSAGE),
      manualEntryPrice: yup.number().nullable(),
    }),
  ),
});
