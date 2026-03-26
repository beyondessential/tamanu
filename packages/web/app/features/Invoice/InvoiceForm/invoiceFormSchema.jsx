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

// Invoice item rows are autofilled with date & quantity only. If the user starts filling in any
// other field (productId, orderedByUserId, or manualEntryPrice), treat the row as intentionally
// edited and require productId and orderedByUserId to be completed before submission.
// Uses != null so that legitimate falsy values like manualEntryPrice=0 are treated as user input.
const hasUserEnteredData = ({ productId, orderedByUserId, manualEntryPrice }) =>
  productId != null || orderedByUserId != null || manualEntryPrice != null;

export const invoiceFormSchema = yup.object({
  invoiceItems: yup.array(
    yup.object().shape({
      orderDate: yup.string().required(REQUIRED_MESSAGE),
      productId: yup.string().when(['orderedByUserId', 'manualEntryPrice'], {
        is: (orderedByUserId, manualEntryPrice) =>
          hasUserEnteredData({ orderedByUserId, manualEntryPrice }),
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
    }, [['productId', 'orderedByUserId']]),
  ),
});
