import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { PatientSearchBar } from '../app/views/patients/components/PatientSearchBar';

storiesOf('PatientSearchBar', module).add('Default', () => (
  <PatientSearchBar onSearch={action('search')} />
));
