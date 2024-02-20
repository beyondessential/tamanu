import { TranslatedText } from './TranslatedText.jsx';
import { MultiselectInput, SelectInput } from '../Field/index.js';
import PropTypes from 'prop-types';
import React from 'react';
import { camelCase } from 'lodash';

const getTranslatedOptions = (options, prefix) =>
  options.map(option => ({
    value: option.value,
    label: (
      <TranslatedText
        stringId={
          option.label.type === TranslatedText
            ? option.label.props.stringId
            : `${prefix}.${camelCase(option.label)}`
        }
        fallback={option.label.type === TranslatedText ? option.label.props.fallback : option.label}
      />
    ),
  }));

// NOTE: not compatible with disabled SelectFields
export const TranslatedSelectField = ({ field, options, prefix, value, name, ...props }) => (
  <SelectInput
    options={getTranslatedOptions(options, prefix)}
    value={field ? field.value : value}
    name={field ? field.name : name}
    {...props}
  />
);

TranslatedSelectField.propTypes = {
  options: PropTypes.object.isRequired,
  prefix: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export const MultiselectField = ({ field, options, prefix, value, name, ...props }) => (
  <MultiselectInput
    options={getTranslatedOptions(options, prefix)}
    value={field ? field.value : value}
    name={field ? field.name : name}
    {...props}
  />
);

MultiselectField.propTypes = {
  options: PropTypes.array.isRequired,
  prefix: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
};
