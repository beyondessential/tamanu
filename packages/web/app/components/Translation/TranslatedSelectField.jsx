import { TranslatedText } from './TranslatedText.jsx';
import { MultiselectField, MultiselectInput, SelectField, SelectInput } from '../Field/index.js';
import PropTypes from 'prop-types';
import React from 'react';

const getTranslatedOptions = (options, prefix) => {
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
  console.log(translatedOptions);
  return translatedOptions;
  // return options.map(option => ({
  //   value: option.value,
  //   label: (
  //     <TranslatedText
  //       stringId={
  //         typeof option.label !== 'string'
  //           ? option.label.props.stringId
  //           : `${prefix}.${option.value}`
  //       }
  //       fallback={typeof option.label !== 'string' ? option.label.props.fallback : option.label}
  //     />
  //   ),
  // }));
};

export const TranslatedSelectField = ({ field, options, prefix, ...props }) => (
  <TranslatedSelectInput
    options={getTranslatedOptions(options, prefix)}
    value={field.value}
    name={field.name}
    {...props}
  />
);

const TranslatedSelectInput = ({ options, prefix, value, name, ...props }) => (
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

export const TranslatedMultiselectField = ({ field, options, prefix, ...props }) => (
  <MultiselectInput
    options={getTranslatedOptions(options, prefix)}
    value={field.value}
    name={field.name}
    onChange={field.onChange}
    {...props}
  />
);
