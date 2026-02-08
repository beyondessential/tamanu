import React from 'react';
import * as yup from 'yup';
import { TranslatedText } from '@tamanu/ui-components';

export const invoiceFormSchema = yup.object({
  invoiceItems: yup.array(
    yup.object().shape({
      orderDate: yup
        .string()
        .required(
          <TranslatedText
            stringId="validation.required.inline"
            fallback="*Required"
            data-testid="translatedtext-8g9w"
          />,
        ),
      productId: yup
        .string()
        .required(
          <TranslatedText
            stringId="validation.required.inline"
            fallback="*Required"
            data-testid="translatedtext-wff4"
          />,
        ),
      orderedByUserId: yup
        .string()
        .required(
          <TranslatedText
            stringId="validation.required.inline"
            fallback="*Required"
            data-testid="translatedtext-dz1y"
          />,
        ),
      quantity: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .required(
          <TranslatedText
            stringId="validation.required.inline"
            fallback="*Required"
            data-testid="translatedtext-029d"
          />,
        ),
      manualEntryPrice: yup.number().nullable(),
    }),
  ),
});
