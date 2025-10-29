import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { useApi } from '../../api';
import { MultiselectField } from '@tamanu/ui-components';
import { Field, TranslatedReferenceData } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useTranslation } from '../../contexts/Translation';

export const useLabTestTypes = labTestCategoryId => {
  const api = useApi();
  const query = useQuery(
    ['labTestType', { labTestCategoryId }],
    () => api.get(`labTestType/${labTestCategoryId}`, { rowsPerPage: 50 }),
    { enabled: !!labTestCategoryId },
  );

  return { ...query, data: query.isSuccess ? query.data.data : [] };
};

export const LabTestTypeField = ({ name = 'labTestTypeIds', label, required, parameterValues }) => {
  const { labTestCategoryId: category } = parameterValues;
  const { data } = useLabTestTypes(category);
  const { getTranslation } = useTranslation();

  if (!category) {
    return null;
  }

  return (
    <Field
      name={name}
      label={
        label ?? (
          <TranslatedText
            stringId="lab.testType.label"
            fallback="Test type"
            data-testid="translatedtext-91oa"
          />
        )
      }
      component={MultiselectField}
      required={required}
      options={data.map(type => ({
        value: type.id,
        label: (
          <TranslatedReferenceData
            value={type.id}
            fallback={type.name}
            category="labTestType"
            data-testid={`translatedreferencedata-8hnu-${type.code}`}
          />
        ),
        searchString: getTranslation(getReferenceDataStringId(type.id, 'labTestType'), type.name),
      }))}
      data-testid="field-llpe"
    />
  );
};
