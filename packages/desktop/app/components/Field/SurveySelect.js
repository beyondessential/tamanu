import React, { useEffect, useState } from 'react';
import { format, compareDesc } from 'date-fns';
import { SelectInput } from './SelectField';
import { useApi } from '../../api';

export const SurveySelect = ({ field, patient, options: _, config, ...props }) => {
  const api = useApi();
  const [options, setOptions] = useState([]);
  const { source } = config;

  useEffect(() => {
    api.get(`/patient/${patient.id}/programResponses?page=0&rowsPerPage=10`).then(resultData => {
      setOptions(
        resultData.data
          .filter(({ surveyId }) => surveyId === source.toLowerCase())
          .sort((a, b) => compareDesc(new Date(a.endTime), new Date(b.endTime)))
          .map(({ id, endTime, surveyName }) => ({
            value: id,
            label: `${format(new Date(endTime), 'dd/MM/yyyy')} ${surveyName}`,
          })),
      );
    });
  }, [api, patient.id, source]);
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
