import React from 'react';
import { getEnumPrefix, throwIfNotRegisteredEnum } from '@tamanu/utils/enumRegistry';
import { getTranslatedOptions } from './getTranslatedOptions';
import { IS_DEVELOPMENT } from '../../utils/env';

export const TranslatedEnumField = ({
  field,
  enumValues,
  transformOptions,
  value,
  name,
  component,
  ...props
}) => {
  if (IS_DEVELOPMENT) {
    throwIfNotRegisteredEnum(enumValues, name);
  }
  const prefix = getEnumPrefix(enumValues);
  const InputComponent = component;

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
