import React from 'react';
import * as yup from 'yup';
import { TranslatedText } from '@tamanu/ui-components';
import { keepsRecordedDate } from '@tamanu/utils/invoice';

const REQUIRED_MESSAGE = (
  <TranslatedText
    stringId="validation.required.inline"
    fallback="*Required"
    data-testid="translatedtext-validation-required"
  />
);

const outOfSectionMessage = (period, formatDate) => (
  <TranslatedText
    stringId="invoice.validation.dateOutsideSection"
    fallback="Enter a date between :firstDate and :lastDate"
    replacements={{
      firstDate: formatDate(period.startDate),
      lastDate: formatDate(period.endDate),
    }}
  />
);

// Every invoice line needs a product and an ordered-by clinician, on both the add and edit paths.
// This also keeps an already-saved line from being cleared to delete it: blanking either field
// fails validation, so the line has to go through the Delete action instead.
//
// `sectionPeriods` maps a section id to the dates its items may carry, both bounds already
// resolved by `resolveSectionPeriods` — a running period ends today, and an unknown one takes the
// encounter's own dates. A row carrying no section falls back to `encounterPeriod`, so the rule
// that an item's date sits within the encounter holds on an unsectioned invoice too.
//
// Only rows the user is adding or editing are held to the period. An already-saved item whose
// date now sits outside it — the admission time was corrected after it was added — stays at the
// date it holds, so an unrelated edit elsewhere on the invoice is not blocked by it.
export const buildInvoiceFormSchema = (
  sectionPeriods = {},
  encounterPeriod = null,
  formatDate = date => date,
) =>
  yup.object({
    invoiceItems: yup.array(
      yup.object().shape({
        orderDate: yup
          .string()
          .required(REQUIRED_MESSAGE)
          .test('within-section', '', function testWithinSection(orderDate) {
            if (keepsRecordedDate(this.parent)) return true;

            const period = sectionPeriods[this.parent.invoiceSectionId] ?? encounterPeriod;
            if (!orderDate || !period?.startDate || !period?.endDate) return true;
            const date = orderDate.slice(0, 10);
            if (date >= period.startDate && date <= period.endDate) return true;
            return this.createError({ message: outOfSectionMessage(period, formatDate) });
          }),
        productId: yup.string().required(REQUIRED_MESSAGE),
        orderedByUserId: yup.string().required(REQUIRED_MESSAGE),
        quantity: yup
          .number()
          .transform((value, originalValue) => (originalValue === '' ? undefined : value))
          .required(REQUIRED_MESSAGE),
        manualEntryPrice: yup.number().nullable(),
        isExistingItem: yup.boolean(),
        originalOrderDate: yup.string().nullable(),
      }),
    ),
  });
