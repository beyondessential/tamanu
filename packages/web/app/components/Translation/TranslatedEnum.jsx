import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText, translatedTextAsString } from './TranslatedText';

export const TranslatedEnum = ({ prefix, value, enumValues, enumFallback = 'Unknown' }) => {
  if (!enumValues[value]) {
    return <TranslatedText stringId="general.fallback.unknown" fallback={enumFallback} />;
  }

  const fallback = enumValues[value];
  const stringId = `${prefix}.${value}`;
  return <TranslatedText stringId={stringId} fallback={fallback} />;
};

/**
 * You should probably not be using this! Consider using the {@link TranslatedEnum} function
 * component.
 *
 * This function was created for {@link DownloadDataButton} to export translated table data, which
 * for some reason is unable to access `getTranslation` via the `useTranslation` hook when Cheerio
 * renders {@link TranslatedText} elements into strings for export to spreadsheet. Hence, in this
 * case we pass `getTranslation` from the caller.
 *
 * @param props Props object for {@link TranslatedText}
 * @param getTranslation The `getTranslation` function from `useTranslation`
 * @returns The translated enum value as a primitive string.
 */
export const translatedEnumAsString = (
  { prefix, value, enumValues, enumFallback = 'Unknown' },
  getTranslation,
) => {
  const props = !enumValues[value]
    ? {
        stringId: 'general.fallback.unknown',
        fallback: enumFallback,
      }
    : {
        stringId: `${prefix}.${value}`,
        fallback: enumValues[value],
      };
  return translatedTextAsString(props, getTranslation);
};

TranslatedEnum.propTypes = {
  prefix: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  enumValues: PropTypes.object.isRequired,
};
