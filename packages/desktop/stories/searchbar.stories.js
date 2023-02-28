import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { MockedApi } from './utils/mockedApi';
import {
  AllPatientsSearchBar,
  PatientSearchBar,
  ImmunisationSearchBar,
  ImagingRequestsSearchBar,
  InvoicesSearchBar,
  AppointmentsSearchBar,
  LabRequestsSearchBar,
  CovidPatientsSearchBar,
} from '../app/components';

const mockEndpoints = {
  'suggestions/labTestLaboratory/all': () => [
    {
      id: '1',
      name: 'Laboratory 1',
    },
    {
      id: '2',
      name: 'Laboratory 2',
    },
  ],
  'suggestions/labTestPriority/all': () => [
    {
      id: '1',
      name: 'Chill',
    },
    {
      id: '2',
      name: 'Urgent',
    },
  ],
  'suggestions/labTestCategory/all': () => [
    {
      id: '1',
      name: 'Category 1',
    },
    {
      id: '2',
      name: 'Category 2',
    },
  ],
};

storiesOf('SearchBar', module)
  .addDecorator(story => <MockedApi endpoints={mockEndpoints}>{story()}</MockedApi>)
  .add('AllPatientSearchBar', () => <AllPatientsSearchBar onSearch={action('search')} />)
  .add('AppointmentsSearchBar', () => <AppointmentsSearchBar onSearch={action('search')} />)
  .add('CovidPatientsSearchBar', () => <CovidPatientsSearchBar onSearch={action('search')} />)
  .add('ImagingRequestsSearchBar', () => <ImagingRequestsSearchBar onSearch={action('search')} />)
  .add('ImmunisationSearchBar', () => <ImmunisationSearchBar onSearch={action('search')} />)
  .add('InvoicesSearchBar', () => <InvoicesSearchBar onSearch={action('search')} />)
  .add('LabRequestsSearchBar', () => <LabRequestsSearchBar onSearch={action('search')} />)
  .add('PatientSearchBar', () => <PatientSearchBar onSearch={action('search')} />);
