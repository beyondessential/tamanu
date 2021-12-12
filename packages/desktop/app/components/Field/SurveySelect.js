import React, { useEffect, useState } from 'react';
import { SelectInput } from './SelectField';
import { connectApi } from '../../api/connectApi';
import { useEncounter } from '../../contexts/Encounter';

//
const id = 'e0f2557f-254f-4d52-8376-39f2fcacfe52';

const DumbSurveySelect = ({ api, promiseData, field, props, patient }) => {
  console.log('SelectInput', promiseData, field, props, patient);
  const [options, setOptions] = useState([]);
  useEffect(() => {
    api
      .get(`/patient/${patient.id}/surveyResponses?page=0&rowsPerPage=10&order=desc&orderBy=date`)
      .then(resultData => {
        const tempOptions = [];
        resultData.data.forEach(option => {
          const dt = option.createdAt
            .substr(0, 10)
            .split('-')
            .reverse()
            .join('/');
          tempOptions.push({
            value: option.id,
            label: `${dt} ${option.surveyName}`,
          });
        });
        setOptions(tempOptions);
      });
  }, []);
  return (
    <SelectInput
      name={field.name}
      onChange={field.onChange}
      value={field.value}
      options={options}
      {...props}
    />
  );
};
export const SurveySelect = connectApi(api => ({ api }))(DumbSurveySelect);
