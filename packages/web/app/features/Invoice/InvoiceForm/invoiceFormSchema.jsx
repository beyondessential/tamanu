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

// Every invoice line needs a product and an ordered-by clinician, on both the add and edit paths.
// This also keeps an already-saved line from being cleared to delete it: blanking either field
// fails validation, so the line has to go through the Delete action instead.
export const invoiceFormSchema = yup.object({
  invoiceItems: yup.array(
    yup.object().shape({
      orderDate: yup.string().required(REQUIRED_MESSAGE),
      productId: yup.string().required(REQUIRED_MESSAGE),
      orderedByUserId: yup.string().required(REQUIRED_MESSAGE),
      quantity: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .required(REQUIRED_MESSAGE),
      manualEntryPrice: yup.number().nullable(),
      isExistingItem: yup.boolean(),
    }),
  ),
});
