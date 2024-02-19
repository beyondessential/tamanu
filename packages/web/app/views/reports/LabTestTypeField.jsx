import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../api';
import { Field } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { TranslatedMultiselectField } from '../../components/Translation/TranslatedSelectField.jsx';

export const useLabTestTypes = labTestCategoryId => {
  const api = useApi();
  const query = useQuery(
    ['labTestType', { labTestCategoryId }],
    () => api.get(`labTestType/${labTestCategoryId}`, { rowsPerPage: 50 }),
    { enabled: !!labTestCategoryId },
  );

  return { ...query, data: query.isSuccess ? query.data.data : [] };
};

export const LabTestTypeField = ({ name = 'labTestTypeIds', required, parameterValues }) => {
  const { labTestCategoryId: category } = parameterValues;
  const { data } = useLabTestTypes(category);

  if (!category) {
    return null;
  }

  return (
    <Field
      name={name}
      label={
        <TranslatedText
          stringId="report.generate.parameter.labTestType.label"
          fallback="Test type"
        />
      }
      component={TranslatedMultiselectField}
      required={required}
      options={data.map(type => ({ value: type.id, label: type.name }))}
      prefix="report.property.labTestType"
    />
  );
};
