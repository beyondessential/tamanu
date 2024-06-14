import { TranslatedText } from './TranslatedText';
import { camelCase } from 'lodash';
import React from 'react';
import { enumRegistry } from '@tamanu/constants';
import { IS_DEVELOPMENT } from '../../utils/env';

export const enforceRegisteredEnum = (prefix, options) => {
  if (!prefix) return;
  if (!enumRegistry.has(options)) {
    console.error('Enum is not registered in enumRegistry');
  }
};

export const getTranslatedOptions = (options, prefix) => {
  if (!options) return [];

  if (IS_DEVELOPMENT) {
    enforceRegisteredEnum(prefix, options);
  }

  return options.map(option => {
    const { label, ...rest } = option;
    return typeof label === 'string'
      ? {
          label: <TranslatedText stringId={`${prefix}.${camelCase(label)}`} fallback={label} />,
          ...rest,
        }
      : option;
  });
};
