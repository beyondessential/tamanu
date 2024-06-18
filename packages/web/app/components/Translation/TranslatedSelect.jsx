import React from 'react';
import { enumRegistry } from '@tamanu/constants';
import { MultiselectInput, SelectInput } from '../Field';
import { getTranslatedOptions } from './getTranslatedOptions';
import { IS_DEVELOPMENT } from '../../utils/env';

const TranslatedSelectInput = ({
  field,
  prefix,
  enumValues,
  transformOptions,
  value,
  name,
  component,
  ...props
}) => {
  const InputComponent = component;
  if (IS_DEVELOPMENT && !enumRegistry.has(enumValues)) {
    throw new Error(
      `TranslatedSelect enumValues for field ${name ||
        field?.name} are not registered in enumRegistry`,
    );
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
    <InputComponent
      options={filteredOptions}
      value={field ? field.value : value}
      name={field ? field.name : name}
      {...props}
    />
  );
};

export const TranslatedSelectField = props => {
  return <TranslatedSelectInput {...props} component={SelectInput} />;
};

export const TranslatedMultiSelectField = props => {
  return <TranslatedSelectInput {...props} component={MultiselectInput} />;
};
