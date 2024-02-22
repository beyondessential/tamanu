import { TranslatedText } from './TranslatedText';
import { MultiselectInput, SelectInput } from '../Field';
import PropTypes from 'prop-types';
import React from 'react';
import { camelCase } from 'lodash';

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
