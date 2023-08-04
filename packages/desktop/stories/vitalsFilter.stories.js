import React from 'react';
import { storiesOf } from '@storybook/react';

import { VitalMultiChartFilterComponent } from '../app/components/VitalMultiChartFilter';

storiesOf('Vitals', module).add('Vital Filter', () => {
  const [values, setValues] = React.useState([]);
  const handleChange = newValue => {
    setValues(newValue.target.value);
  };

  const options = [
    { label: 'Temperature', value: 'option1' },
    { label: 'Blood pressure', value: 'option2' },
    { label: 'Heart rate', value: 'option3' },
    { label: 'Respiratory rate', value: 'option4' },
    { label: 'SpO2', value: 'option5' },
  ];

  const field = {
    name: 'multiSelectFieldKey',
    value: values,
    onChange: handleChange,
  };

  return <VitalMultiChartFilterComponent options={options} field={field} />;
});
