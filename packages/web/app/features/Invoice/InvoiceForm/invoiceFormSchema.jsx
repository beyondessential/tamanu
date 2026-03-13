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

// Returns true if the user has entered data into any field beyond the autofilled ones (date & qty)
const hasUserEnteredData = ({ productId, orderedByUserId, manualEntryPrice }) =>
  Boolean(productId) || Boolean(orderedByUserId) || Boolean(manualEntryPrice);

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
