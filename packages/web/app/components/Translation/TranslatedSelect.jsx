import React from 'react';
// import { getEnumPrefix } from '@tamanu/shared/utils';
import { MultiselectInput, SelectInput } from '../Field';
import { getTranslatedOptions } from './getTranslatedOptions';
// import { IS_DEVELOPMENT } from '../../utils/env';
// import { throwIfNotRegisteredEnum } from '../../utils/throwIfNotRegisteredEnum';

const TranslatedSelectInput = ({
  field,
  enumValues,
  transformOptions,
  value,
  name,
  component,
  ...props
}) => {
  // if (IS_DEVELOPMENT) {
  //   throwIfNotRegisteredEnum(enumValues, name);
  // }
  const prefix = 'placeholder_dog';
  const InputComponent = component;

  const filteredOptions = transformOptions
    ? transformOptions(translatedOptions)
    : translatedOptions;

  const translatedOptions = getTranslatedOptions(
    Object.entries(enumValues).map(([value, label]) => ({
      value,
      label,
    })),
    prefix,
  );
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
