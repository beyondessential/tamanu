import React from 'react';
import PropTypes from 'prop-types';
import { camelCase } from 'lodash';

import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';

import { TranslatedText } from './TranslatedText';

export const getReferenceDataStringId = (value, category) => {
  return `${REFERENCE_DATA_TRANSLATION_PREFIX}.${category}.${value}`;
};

export const getReferenceDataOptionStringId = (value, category, option) => {
  return `${getReferenceDataStringId(value, category)}.option.${camelCase(option)}`;
};

export const TranslatedReferenceData = ({ category, value, fallback, placeholder }) => {
  return value ? (
    <TranslatedText
      stringId={getReferenceDataStringId(value, category)}
      fallback={`${fallback}`}
      data-testid="translatedtext-w3hp"
    />
  ) : (
    placeholder
  );
};

TranslatedReferenceData.propTypes = {
  category: PropTypes.string.isRequired,
  value: PropTypes.string,
  fallback: PropTypes.string.isRequired,
  placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};
