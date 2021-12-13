import React, { useEffect, useState } from 'react';
import { SelectInput } from './SelectField';
import { connectApi } from '../../api/connectApi';

const DumbSurveySelect = ({ api, field, props, patient }) => {
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
