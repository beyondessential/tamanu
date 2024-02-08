import { useTranslation } from '../../contexts/Translation.jsx';
import { DebugTooltip } from './DebugTooltip.jsx';
import React from 'react';
import PropTypes from 'prop-types';

// Set DEBUG_TRANSLATION to true in localstorage if you want to highlight all translated strings in red
const DEBUG_TRANSLATION_KEY = 'DEBUG_TRANSLATION';
const safeGetIsDebugMode = () => {
  try {
    return JSON.parse(localStorage.getItem(DEBUG_TRANSLATION_KEY));
  } catch (e) {
    return false;
  }
};

export const TranslatedEnum = ({ prefix, value, enumValues }) => {
  const { getTranslation } = useTranslation();

  const stringId = `${prefix}.${value}`;
  console.log(stringId);

  const translation = getTranslation(stringId, enumValues[value]?.split('\\n').join('\n'));

  const isDebugMode = safeGetIsDebugMode();
  if (isDebugMode)
    return (
      <DebugTooltip stringId={stringId} fallback={enumValues[value]}>
        {translation}
      </DebugTooltip>
    );
  return translation;
};

TranslatedEnum.propTypes = {
  prefix: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  enumValues: PropTypes.object.isRequired,
};
