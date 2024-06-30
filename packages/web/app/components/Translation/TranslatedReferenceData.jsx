import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText, translatedTextAsString } from './TranslatedText';
import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';

export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};

export const TranslatedReferenceData = ({ category, value, fallback, placeholder }) => {
  console.log(
    `<TranslatedReferenceData stringId={(\x1b[1m${value}\x1b[m, \x1b[1m${category}\x1b[m)} />`,
  );
  return value ? (
    <TranslatedText stringId={getReferenceDataStringId(value, category)} fallback={`${fallback}`} />
  ) : (
    placeholder
  );
};

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
