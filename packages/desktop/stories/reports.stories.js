import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { DIAGNOSES } from 'Shared/demoData';
import { MultiDiagnosisSelector } from '../app/components/MultiDiagnosisSelector';
import { ReportGeneratorForm } from '../app/forms/ReportGeneratorForm';
import { VillageDiagnosesByWeekReport } from '../app/views/reports/VillageDiagnosesByWeekReport';

import { createDummySuggester, mapToSuggestions } from './utils';
import moment from 'moment';

const icd10Suggester = createDummySuggester(mapToSuggestions(DIAGNOSES));

const BoundSelector = () => {
  const [value, setValue] = React.useState([]);
  const onChange = React.useCallback(e => {
    setValue(e.target.value);
  });
  return (
    <MultiDiagnosisSelector value={value} onChange={onChange} icd10Suggester={icd10Suggester} />
  );
};

storiesOf('Reports/MultiDiagnosisSelector', module).add('default', () => <BoundSelector />);

storiesOf('Reports/MultiDiagnosisSelector', module).add('in form', () => (
  <ReportGeneratorForm onSubmit={action('submit')} icd10Suggester={icd10Suggester} />
));

async function runDummyVillageQuery(filters) {
  // TODO: api request
  await new Promise(resolve => setTimeout(resolve, 1000));

  const { diagnoses, startDate, endDate } = filters;
  const start = moment(startDate);
  const end = moment(endDate);
  const ranges = [ ];

  let date = moment(start);
  while(date < end) {
    ranges.push(date);
    date = moment(date).add(1, 'week');
  }

  const columns = ranges.map(x => x.format('DD/MM/YYYY'));

  const results = diagnoses.map(({ _id }) => ({
    key: _id,
    formatted: icd10Suggester.fetchCurrentOption(_id).label,
    values: columns.map(c => Math.floor(Math.random() * 10)),
  }));

  const meta = {
    title: "Diagnosis",
    columns,
  };

  return { results, meta };
}

storiesOf('Reports/Village diagnoses by week', module).add('default', () => <VillageDiagnosesByWeekReport 
  icd10Suggester={icd10Suggester}
  onRunQuery={runDummyVillageQuery}
/>);
