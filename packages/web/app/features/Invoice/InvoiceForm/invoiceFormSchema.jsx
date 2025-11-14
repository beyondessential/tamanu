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
          .required(
            <TranslatedText
              stringId="general.required"
              fallback="Required"
              data-testid="translatedtext-029d"
            />,
          ),
        productPrice: yup.number(),
      },
      [
        ['orderDate', 'productId'],
        ['productId', 'orderedByUserId'],
        ['orderDate', 'orderedByUserId'],
      ],
    ),
  ),
  insurers: yup.array(
    yup.object({
      insurerId: yup
        .string()
        .required()
        .translatedLabel(
          <TranslatedText
            stringId="invoice.modal.editInvoice.insurer.label"
            fallback="Insurer"
            data-testid="translatedtext-ufad"
          />,
        ),
      percentage: yup
        .number()
        .required(
          <TranslatedText
            stringId="general.required"
            fallback="Required"
            data-testid="translatedtext-vh20"
          />,
        ),
    }),
  ),
  totalInsurerPercentage: yup
    .mixed()
    .test(
      'totalInsurerPercentage',
      <TranslatedText
        stringId="invoice.modal.editInvoice.insurer.totalPercentageError"
        fallback="Total insurer percentage must be less than or equal to 100%"
        data-testid="translatedtext-ddnm"
      />,
      function(_, context) {
        return context.parent.insurers.reduce((acc, curr) => acc + curr.percentage || 0, 0) <= 100;
      },
    ),
});
