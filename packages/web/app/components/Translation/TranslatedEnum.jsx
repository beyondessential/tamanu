import React from 'react';
import PropTypes from 'prop-types';
import { TranslatedText } from './TranslatedText.jsx';

export const TranslatedEnum = ({ prefix, value, enumValues }) => {
  const stringId = `${prefix}.${value}`;
  const fallback = enumValues[value];

  return <TranslatedText stringId={stringId} fallback={fallback} />;
};

TranslatedEnum.propTypes = {
  prefix: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  enumValues: PropTypes.object.isRequired,
};
