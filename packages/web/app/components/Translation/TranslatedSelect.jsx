import React from 'react';
import { getEnumPrefix, throwIfNotRegisteredEnum } from '@tamanu/shared/utils/enumRegistry';
import { SelectInput, MultiselectInput } from '@tamanu/ui-components';
import { getTranslatedOptions } from './getTranslatedOptions';
import { IS_DEVELOPMENT } from '../../utils/env';

const TranslatedSelectInput = ({
  field,
  enumValues,
  transformOptions,
  TranslatedTextProps,
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
    TranslatedTextProps,
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
      data-testid="inputcomponent-c7e9"
    />
  );
};

export const TranslatedSelectField = props => {
  return (
    <TranslatedSelectInput
      {...props}
      component={SelectInput}
      data-testid="translatedselectinput-d25a"
    />
  );
};

export const TranslatedMultiSelectField = props => {
  return (
    <TranslatedSelectInput
      {...props}
      component={MultiselectInput}
      data-testid="translatedselectinput-db37"
    />
  );
};
