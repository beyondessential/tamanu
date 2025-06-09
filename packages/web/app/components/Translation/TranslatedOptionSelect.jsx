import React from 'react';

import { getReferenceDataOptionStringId } from './TranslatedReferenceData';
import { useTranslation } from '../../contexts/Translation';
import { SelectField } from '../Field/SelectField';

export const TranslatedOptionSelectField = ({ options, referenceDataId, referenceDataCategory, ...props }) => {
  const { getTranslation } = useTranslation();
  const translatedOptions = options.map(option => {
    const stringId = getReferenceDataOptionStringId(referenceDataId, referenceDataCategory, option);
    return {
      label: getTranslation(stringId, option),
      value: option,
    };
  });
  return (
    <SelectField
      options={translatedOptions}
      {...props}
    />
  );
};
