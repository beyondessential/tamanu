import React from 'react';
import * as yup from 'yup';
import { TranslatedText } from '@tamanu/ui-components';

export const invoiceFormSchema = yup.object({
  invoiceItems: yup.array(
    yup.object().shape(
      {
        orderDate: yup.string().when(['productId', 'orderedByUserId'], {
          is: (productId, orderedByUserId) => productId || orderedByUserId,
          then: yup
            .string()
            .required(
              <TranslatedText
                stringId="validation.required.inline"
                fallback="*Required"
                data-testid="translatedtext-8g9w"
              />,
            ),
          otherwise: yup.string(),
        }),
        productId: yup.string().when(['orderDate', 'orderedByUserId'], {
          is: (orderDate, orderedByUserId) => orderDate || orderedByUserId,
          then: yup
            .string()
            .required(
              <TranslatedText
                stringId="validation.required.inline"
                fallback="*Required"
                data-testid="translatedtext-wff4"
              />,
            ),
          otherwise: yup.string(),
        }),
        orderedByUserId: yup.string().when(['orderDate', 'productId'], {
          is: (orderDate, productId) => orderDate || productId,
          then: yup
            .string()
            .required(
              <TranslatedText
                stringId="validation.required.inline"
                fallback="*Required"
                data-testid="translatedtext-dz1y"
              />,
            ),
          otherwise: yup.string(),
        }),
        quantity: yup
          .number()
          .transform((value, originalValue) => (originalValue === '' ? undefined : value))
          .required(
            <TranslatedText
              stringId="general.required"
              fallback="*Required"
              data-testid="translatedtext-029d"
            />,
          ),
        manualEntryPrice: yup.number().nullable(),
      },
      [
        ['orderDate', 'productId'],
        ['productId', 'orderedByUserId'],
        ['orderDate', 'orderedByUserId'],
      ],
    ),
  ),
});
