import { TranslatedText } from './TranslatedText.jsx';
import { MultiselectField, MultiselectInput, SelectField, SelectInput } from '../Field/index.js';
import PropTypes from 'prop-types';
import React from 'react';

const getTranslatedOptions = (options, prefix) => {
  return options.map(option => ({
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
};

export const TranslatedSelectField = ({ options, prefix, name, value, ...props }) => (
  <SelectInput
    options={getTranslatedOptions(options, prefix)}
    value={value}
    name={name}
    {...props}
  />
);

TranslatedSelectField.propTypes = {
  options: PropTypes.object.isRequired,
  prefix: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export const TranslatedMultiselectField = ({ options, prefix, name, value, ...props }) => (
  <MultiselectInput
    options={getTranslatedOptions(options, prefix)}
    value={value}
    name={name}
    {...props}
  />
);
