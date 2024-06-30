import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText, translatedTextAsString } from './TranslatedText';
import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';

export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};

export const TranslatedReferenceData = ({ category, value, fallback, placeholder }) => {
  return value ? (
    <TranslatedText stringId={getReferenceDataStringId(value, category)} fallback={`${fallback}`} />
  ) : (
    placeholder
  );
};

/**
 * You should probably not be using this! Consider using the {@link TranslatedReferenceData}
 * function component.
 *
 * This function was created for {@link DownloadDataButton} to export translated table data, which
 * for some reason is unable to access `getTranslation` via the `useTranslation` hook when Cheerio
 * renders {@link TranslatedText} elements into strings for export to spreadsheet. Hence, in this
 * case we pass `getTranslation` from the caller.
 *
 * @param props Props object for {@link TranslatedReferenceData}
 * @param getTranslation The `getTranslation` function from `useTranslation`
 * @returns The translated reference data as a primitive string.
 */
export const translatedReferenceDataAsString = (
  { category, value, fallback, placeholder },
  getTranslation,
) =>
  value
    ? translatedTextAsString(
        {
          stringId: getReferenceDataStringId(value, category),
          fallback: `${fallback}`,
        },
        getTranslation,
      )
    : placeholder;

TranslatedReferenceData.propTypes = {
  category: PropTypes.string.isRequired,
  value: PropTypes.string,
  fallback: PropTypes.string.isRequired,
  placeholder: PropTypes.element,
};
