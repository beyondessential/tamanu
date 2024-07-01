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

export const TranslatedText = ({
  stringId,
  fallback,
  replacements,
  uppercase,
  lowercase,
  /**
   * You should probably not be using this prop! Consider deferring to the `useTranslation` context
   * hook.
   *
   * @privateRemarks This prop exists for the edge case in {@link DownloadDataButton}, where this
   * component can’t see the {@link TranslationProvider}. In that case, the ancestor fetches the
   * context itself, and explicitly passes it down as a prop.
   */
  customTranslationContext,
}) => {
  const translationContext = useTranslation();
  const { getTranslation } = customTranslationContext ?? translationContext;

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

TranslatedText.propTypes = {
  stringId: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};
