import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { DIAGNOSES } from 'Shared/demoData';
import { MultiDiagnosisSelector } from '../app/components/MultiDiagnosisSelector';
import { ReportGeneratorForm } from '../app/forms/ReportGeneratorForm';

import { createDummySuggester, mapToSuggestions } from './utils';

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
