import React from 'react';
import { REFERENCE_TYPES } from '@tamanu/constants';
import { DateDisplay, TranslatedReferenceData, TranslatedText } from '@tamanu/ui-components';

/** A section's configured name, as reference data so it localises like the rest. */
export const SectionName = ({ section }) => (
  <TranslatedReferenceData
    value={section.invoiceSectionId}
    fallback={section.name}
    category={REFERENCE_TYPES.INVOICE_SECTION}
  />
);

/**
 * The dates a section covers, as the header and the Add items window both show them. A period
 * still running reads as its start followed by Current; one the facility cannot establish shows
 * nothing, leaving the name to stand alone.
 */
export const SectionPeriod = ({ section }) =>
  section.startDate ? (
    <>
      <DateDisplay date={section.startDate} format="shortest" />
      {' - '}
      {section.endDate ? (
        <DateDisplay date={section.endDate} format="shortest" />
      ) : (
        <TranslatedText stringId="invoice.section.current" fallback="Current" />
      )}
    </>
  ) : null;
