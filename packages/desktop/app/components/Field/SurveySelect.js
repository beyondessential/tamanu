import React, { useEffect, useState } from 'react';
import { SelectInput } from './SelectField';
import { useApi } from '../../api';

export const SurveySelect = ({ field, patient, options: _, ...props }) => {
  const api = useApi();
  const [options, setOptions] = useState([]);
  useEffect(() => {
    api
      .get(`/patient/${patient.id}/programResponses?page=0&rowsPerPage=10&order=desc&orderBy=date`)
      .then(resultData => {
        setOptions(
          resultData.data.map(({ id, createdAt, surveyName }) => {
            const dt = createdAt
              .substr(0, 10)
              .split('-')
              .reverse()
              .join('/');
            return {
              value: id,
              label: `${dt} ${surveyName}`,
            };
          }),
        );
      });
  }, [api, patient.id]);
  return (
    <SelectInput
      {...props}
      name={field.name}
      onChange={field.onChange}
      value={field.value}
      options={options}
    />
  );
};
