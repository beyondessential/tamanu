import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { PatientSearchBar } from '../app/views/patients/components';
import { LabRequestsSearchBar } from '../app/components/LabRequestsSearchBar';

storiesOf('SearchBar', module).add('PatientSearchBar', () => (
  <PatientSearchBar onSearch={action('search')} />
));

storiesOf('SearchBar', module).add('LabRequestsSearchBar', () => (
  <LabRequestsSearchBar onSearch={action('search')} />
));
