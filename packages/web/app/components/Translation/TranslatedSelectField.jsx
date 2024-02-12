import { TranslatedText } from './TranslatedText.jsx';
import { SelectField, SelectInput } from '../Field/index.js';
import PropTypes from 'prop-types';
import React from 'react';

export const TranslatedSelectField = ({ options, prefix, name, value, ...props }) => {
  const translatedOptions = options.map(option => ({
    value: option.value,
    label: (
      <TranslatedText
        stringId={
          typeof option.label !== 'string'
            ? option.label.props.stringId
            : `${prefix}.${option.value}`
        }
        fallback={typeof option.label !== 'string' ? option.label.props.fallback : option.label}
      />
    ),
  }));

  return (
    <SelectField
      field={SelectInput}
      options={translatedOptions}
      value={value}
      name={name}
      {...props}
    />
  );
};

TranslatedSelectField.propTypes = {
  options: PropTypes.object.isRequired,
  prefix: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};
