import React, { useMemo } from 'react';
import { getReferenceDataOptionStringId } from '@tamanu/shared/utils/translation';
import { useTranslation } from '../../contexts/TranslationContext';
import { SelectField } from '../Field/SelectField';
import { TranslatedText } from './TranslatedText';

export const TranslatedOptionSelectField = ({
  options,
  referenceDataId,
  referenceDataCategory,
  ...props
}) => {
  const { getTranslation } = useTranslation();
  const translatedOptions = useMemo(
    () =>
      options.map(option => {
        const stringId = getReferenceDataOptionStringId(
          referenceDataId,
          referenceDataCategory,
          option,
        );
        return {
          label: getTranslation(stringId, option),
          value: option,
        };
      }),
    [options, referenceDataId, referenceDataCategory, getTranslation],
  );
  return <SelectField options={translatedOptions} {...props} />;
};

export const TranslatedOption = ({ value, referenceDataId, referenceDataCategory }) => {
  const stringId = getReferenceDataOptionStringId(referenceDataId, referenceDataCategory, value);
  return <TranslatedText stringId={stringId} fallback={value} />;
};
