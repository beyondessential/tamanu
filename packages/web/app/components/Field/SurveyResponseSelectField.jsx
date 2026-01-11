import React, { useEffect, useState } from 'react';
import { compareDesc } from 'date-fns';

import { DateDisplay, TimeDisplay } from '../DateDisplay';
import { SelectInput } from '@tamanu/ui-components';
import { useApi } from '../../api';

const getDataLabel = (endTime, surveyName) => (
  <>
    <DateDisplay date={endTime} /> <TimeDisplay date={endTime} />{' '}
    {surveyName}
  </>
);

export const SurveyResponseSelectField = ({ field, patient, config, ...props }) => {
  delete props.options;

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
      data-testid="selectinput-ra3s"
    />
  );
};
