import React from 'react';

import { getReferenceDataOptionStringId } from './TranslatedReferenceData';
import { useTranslation } from '../../contexts/Translation';
import { Field, SelectField } from '../Form';

export const TranslatedOptionSelectField = ({ field, options, referenceDataId, referenceDataCategory, ...props }) => {
  const { getTranslation } = useTranslation();
  const translatedOptions = options.map(option => {
    const stringId = getReferenceDataOptionStringId(referenceDataId, referenceDataCategory, option);
    return {
      label: getTranslation(stringId, option),
      value: option,
    };
  });
  return (
    <Field
      name={field.name}
      value={field.value}
      component={SelectField}
      options={translatedOptions}
      {...props}
    />
  );
};
