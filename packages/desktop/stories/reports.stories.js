import React from 'react';
import { storiesOf } from '@storybook/react';

import { MultiDiagnosisSelector } from '../app/components/MultiDiagnosisSelector';

import { DIAGNOSES } from 'Shared/demoData';
import { createDummySuggester, mapToSuggestions } from './utils';

const icd10Suggester = createDummySuggester(mapToSuggestions(DIAGNOSES));

const BoundSelector = () => {
  const [value, setValue] = React.useState([]);
  return <MultiDiagnosisSelector value={value} onChange={setValue} icd10Suggester={icd10Suggester} />;
};

storiesOf('Reports/MultiDiagnosisSelector', module)
  .add('default', () => <BoundSelector />);
