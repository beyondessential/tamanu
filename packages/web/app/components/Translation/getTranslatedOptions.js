import { TranslatedText } from './TranslatedText';
import { camelCase } from 'lodash';
import React from 'react';

export const getTranslatedOptions = (options, prefix) =>
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
