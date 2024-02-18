import { TranslatedText } from './TranslatedText.jsx';
import { SelectInput } from '../Field/index.js';
import PropTypes from 'prop-types';
import React from 'react';

const transformStringIdSuffix = suffix => {
  const words = suffix
    .toString()
    .split(/\s/g)
    .map((word, index) => {
      return index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1).toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  return words.join('');
};

const getTranslatedOptions = (options, prefix) => {
  console.log('this is original', options);
  console.log(prefix);
  const translatedOptions = options.map(option => ({
    value: option.value,
    label: (
      <TranslatedText
        stringId={
          option.label.type === TranslatedText
            ? option.label.props.stringId // handling when the options list already has TranslatedText components in it
            : `${prefix}.${transformStringIdSuffix(option.label)}`
        }
        fallback={
          option.label.type === TranslatedText
            ? option.label.props.fallback
            : option.label.toString()
        }
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

// NOTE: not compatible with disabled SelectFields
export const SelectField = ({ field, options, prefix, value, name, ...props }) => (
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
