import React, { useEffect, useState } from 'react';
import { compareDesc, parseISO } from 'date-fns';
import { formatShort, formatTime } from '../DateDisplay';
import { SelectInput } from './SelectField';
import { useApi } from '../../api';

export const SurveyResponseSelectField = ({ field, patient, options: _, config, ...props }) => {
  const api = useApi();
  const [options, setOptions] = useState([]);
  const { source } = config;

  useEffect(() => {
    api.get(`/patient/${patient.id}/programResponses`, { surveyId: source }).then(resultData => {
      setOptions(
        resultData.data
          .sort((a, b) => compareDesc(parseISO(a.endTime), parseISO(b.endTime)))
          .map(({ id, endTime, surveyName }) => ({
            value: id,
            label: `${formatShort(parseISO(endTime))} ${formatTime(
              parseISO(endTime),
            )} ${surveyName}`,
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
