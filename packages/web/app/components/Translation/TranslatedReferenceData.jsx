import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText } from './TranslatedText';

export const getReferenceDataStringId = (value, category) => {
  return `referenceData.${category}.${value}`;
};

export const TranslatedReferenceData = ({ category, value, fallback, placeholder }) => {
  return value ? (
    <TranslatedText stringId={`referenceData.${category}.${value}`} fallback={`${fallback}`} />
  ) : (
    { placeholder }
  );
};

TranslatedReferenceData.propTypes = {
  category: PropTypes.string.isRequired,
  value: PropTypes.string,
  fallback: PropTypes.string.isRequired,
  placeholder: PropTypes.element,
};
