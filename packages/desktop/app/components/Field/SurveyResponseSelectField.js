import React, { useEffect, useState } from 'react';
import { compareDesc } from 'date-fns';
import { DateDisplay, formatTime } from '../DateDisplay';
import { SelectInput } from './SelectField';
import { useApi } from '../../api';

const getDataLabel = (endTime, surveyName) => {
  const shortDate = DateDisplay.rawFormat(endTime);
  const time = DateDisplay.rawFormat(endTime, formatTime);
  return `${shortDate} ${time} ${surveyName}`;
};

export const SurveyResponseSelectField = ({ field, patient, options: _, config, ...props }) => {
  const api = useApi();
  const [options, setOptions] = useState([]);
  const { source } = config;

  useEffect(() => {
    api.get(`/patient/${patient.id}/programResponses`, { surveyId: source }).then(resultData => {
      setOptions(
        resultData.data
          .sort((a, b) => compareDesc(new Date(a.endTime), new Date(b.endTime)))
          .map(({ id, endTime, surveyName }) => ({
            value: id,
            label: getDataLabel(endTime, surveyName),
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
