import React from 'react';
import { REFERENCE_TYPES } from '@tamanu/constants';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import {
  DateDisplay,
  TranslatedReferenceData,
  TranslatedText,
  useDateTime,
} from '@tamanu/ui-components';
import { useTranslation } from '../../../contexts/Translation';

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

/**
 * The name above as a plain string, for copy that reads a section inside a sentence. Resolved the
 * same way the component resolves it, so a section cannot be named one thing in a header and
 * another in the window opened from it.
 */
export const useSectionName = () => {
  const { getTranslation } = useTranslation();
  return section =>
    getTranslation(
      getReferenceDataStringId(section.invoiceSectionId, REFERENCE_TYPES.INVOICE_SECTION),
      section.name,
    );
};

/**
 * The period above as a plain string, for the same reason. Kept apart from the name so copy that
 * only names a section does not take a dependency on the facility's dates. A section whose period
 * the facility cannot establish has no period text.
 */
export const useSectionPeriodText = () => {
  const { getTranslation } = useTranslation();
  const { formatShortest } = useDateTime();
  return section => {
    if (!section.startDate) return null;
    const end = section.endDate
      ? formatShortest(section.endDate)
      : getTranslation('invoice.section.current', 'Current');
    return `${formatShortest(section.startDate)} - ${end}`;
  };
};
