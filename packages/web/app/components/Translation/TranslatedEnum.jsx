import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText } from './TranslatedText';

export const TranslatedEnum = ({
  prefix,
  value,
  enumValues,
  enumFallback = 'Unknown',
  customTranslationContext,
}) => {
  if (!enumValues[value]) {
    return (
      <TranslatedText
        stringId="general.fallback.unknown"
        fallback={enumFallback}
        customTranslationContext={customTranslationContext}
      />
    );
  }

  const fallback = enumValues[value];
  const stringId = `${prefix}.${value}`;
  return (
    <TranslatedText
      stringId={stringId}
      fallback={fallback}
      customTranslationContext={customTranslationContext}
    />
  );
};

TranslatedEnum.propTypes = {
  prefix: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  enumValues: PropTypes.object.isRequired,
};
