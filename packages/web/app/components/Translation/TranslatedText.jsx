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

export const translatedTextAsString = (
  { stringId, fallback, replacements, uppercase, lowercase },
  getTranslation,
) =>
  getTranslation(stringId, fallback?.split('\\n').join('\n'), replacements, uppercase, lowercase);

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
