import React from 'react';
import { enumRegistry } from '@tamanu/constants';
import { MultiselectInput, SelectInput } from '../Field';
import { getTranslatedOptions } from './getTranslatedOptions';
import { IS_DEVELOPMENT } from '../../utils/env';

export const TranslatedSelectField = ({
  field,
  prefix,
  enumValues,
  transformOptions,
  value,
  name,
  ...props
}) => {
  if (IS_DEVELOPMENT && !enumRegistry.has(enumValues)) {
    throw new Error('Select options are not registered in enumRegistry');
  }
  const translatedOptions = getTranslatedOptions(
    Object.entries(enumValues).map(([value, label]) => ({
      value,
      label,
    })),
    prefix,
  );
  const filteredOptions = transformOptions
    ? transformOptions(translatedOptions)
    : translatedOptions;
  return (
    <SelectInput
      options={filteredOptions}
      value={field ? field.value : value}
      name={field ? field.name : name}
      {...props}
    />
  );
};

export const TranslatedMultiSelectField = ({
  field,
  prefix,
  enumValues,
  transformOptions,
  value,
  name,
  ...props
}) => {
  if (IS_DEVELOPMENT && !enumRegistry.has(enumValues)) {
    throw new Error('Select options are not registered in enumRegistry');
  }
  const translatedOptions = getTranslatedOptions(
    Object.entries(enumValues).map(([value, label]) => ({
      value,
      label,
    })),
    prefix,
  );
  const filteredOptions = transformOptions
    ? transformOptions(translatedOptions)
    : translatedOptions;
  return (
    <MultiselectInput
      options={filteredOptions}
      value={field ? field.value : value}
      name={field ? field.name : name}
      {...props}
    />
  );
};
