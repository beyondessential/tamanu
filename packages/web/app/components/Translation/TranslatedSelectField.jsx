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

export const TranslatedSelectField = ({ field, options, prefix, value, name, ...props }) => (
  <SelectInput
    options={getTranslatedOptions(options, prefix)}
    value={field ? field.value : value}
    name={field ? field.name : name}
    {...props}
  />
);

SelectField.propTypes = {
  options: PropTypes.object.isRequired,
  prefix: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};
