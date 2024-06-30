import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from '../../contexts/Translation';
import { DebugTooltip } from './DebugTooltip';

// Set DEBUG_TRANSLATION to true in localstorage if you want to highlight all translated strings in red
const DEBUG_TRANSLATION_KEY = 'DEBUG_TRANSLATION';
const safeGetIsDebugMode = () => {
  try {
    return JSON.parse(localStorage.getItem(DEBUG_TRANSLATION_KEY));
  } catch (e) {
    return false;
  }
};

export const TranslatedText = ({ stringId, fallback, replacements, uppercase, lowercase }) => {
  const { getTranslation } = useTranslation();

  const translation = useMemo(
    () =>
      getTranslation(
        stringId,
        fallback?.split('\\n').join('\n'),
        replacements,
        uppercase,
        lowercase,
      ),
    [getTranslation, stringId, fallback, replacements, uppercase, lowercase],
  );

  const isDebugMode = safeGetIsDebugMode();
  if (isDebugMode)
    return (
      <DebugTooltip stringId={stringId} replacements={replacements} fallback={fallback}>
        {translation}
      </DebugTooltip>
    );
  return translation;
};

/**
 * You should probably not be using this! Consider using the {@link TranslatedText} function
 * component.
 *
 * This function was created for {@link DownloadDataButton} to export translated table data, which
 * for some reason is unable to access `getTranslation` via the `useTranslation` hook when Cheerio
 * renders {@link TranslatedText} elements into strings for export to spreadsheet. Hence, in this
 * case we pass `getTranslation` from the caller.
 *
 * @param props Props object for {@link TranslatedText}
 * @param getTranslation The `getTranslation` function from `useTranslation`
 * @returns The translated text as a primitive string.
 */
export const translatedTextAsString = (
  { stringId, fallback, replacements, uppercase, lowercase },
  getTranslation,
) =>
  getTranslation(stringId, fallback?.split('\\n').join('\n'), replacements, uppercase, lowercase);

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
