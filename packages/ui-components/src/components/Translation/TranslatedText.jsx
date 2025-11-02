import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from '../../contexts/TranslationContext';
import { DebugTooltip } from './DebugTooltip';

// Set DEBUG_TRANSLATION to true in localstorage if you want to highlight all translated strings in red (except suggester results)
const DEBUG_TRANSLATION_KEY = 'DEBUG_TRANSLATION';
const safeGetIsDebugMode = () => {
  try {
    return JSON.parse(localStorage.getItem(DEBUG_TRANSLATION_KEY));
  } catch (e) {
    return false;
  }
};

export const TranslatedText = ({ stringId, fallback, replacements, casing }) => {
  const { getTranslation } = useTranslation();

  const translation = useMemo(
    () => getTranslation(stringId, fallback?.split('\\n').join('\n'), { replacements, casing }),
    [getTranslation, stringId, fallback, replacements, casing],
  );

  const isDebugMode = safeGetIsDebugMode();
  if (isDebugMode)
    return (
      <DebugTooltip
        stringId={stringId}
        replacements={replacements}
        fallback={fallback}
        data-testid="debugtooltip-kuf4"
      >
        {translation}
      </DebugTooltip>
    );
  return translation;
};

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
