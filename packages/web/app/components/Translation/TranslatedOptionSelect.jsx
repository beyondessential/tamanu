import React, { useMemo } from 'react';

import { getReferenceDataOptionStringId } from './TranslatedReferenceData';
import { useTranslation } from '../../contexts/Translation';
import { SelectField } from '../Field/SelectField';

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

export const TranslatedOption = ({
  option,
  referenceDataId,
  referenceDataCategory,
}) => {
  const { getTranslation } = useTranslation();
  const stringId = getReferenceDataOptionStringId(referenceDataId, referenceDataCategory, option);
  return getTranslation(stringId, option);
};
