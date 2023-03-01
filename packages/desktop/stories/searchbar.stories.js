import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
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

storiesOf('SearchBar', module)
  .add('AllPatientSearchBar', () => <AllPatientsSearchBar onSearch={action('search')} />)
  .add('AppointmentsSearchBar', () => <AppointmentsSearchBar onSearch={action('search')} />)
  .add('CovidPatientsSearchBar', () => <CovidPatientsSearchBar onSearch={action('search')} />)
  .add('ImagingRequestsSearchBar', () => <ImagingRequestsSearchBar onSearch={action('search')} />)
  .add('ImmunisationSearchBar', () => <ImmunisationSearchBar onSearch={action('search')} />)
  .add('InvoicesSearchBar', () => <InvoicesSearchBar onSearch={action('search')} />)
  .add('LabRequestsSearchBar', () => <LabRequestsSearchBar onSearch={action('search')} />)
  .add('PatientSearchBar', () => <PatientSearchBar onSearch={action('search')} />);
