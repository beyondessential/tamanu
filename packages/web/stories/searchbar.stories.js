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

import { DumbLocalisationProvider } from '../app/contexts/Localisation';

const localisationData = {
  fields: {
    displayId: {
      shortLabel: 'NHN',
      longLabel: 'National Health Number',
    },
    firstName: {
      shortLabel: 'First name',
      longLabel: 'First name',
    },
    middleName: {
      shortLabel: 'Middle name',
      longLabel: 'Middle name',
      hidden: false,
    },
    lastName: {
      shortLabel: 'Last name',
      longLabel: 'Last name',
    },
    culturalName: {
      shortLabel: 'Cultural name',
      longLabel: 'Cultural/traditional name',
      hidden: false,
    },
    sex: {
      shortLabel: 'Sex',
      longLabel: 'Sex',
      hidden: false,
    },
    email: {
      shortLabel: 'Email',
      longLabel: 'Email',
      hidden: false,
    },
    dateOfBirth: {
      shortLabel: 'DOB',
      longLabel: 'Date of birth',
    },
    dateOfBirthFrom: {
      shortLabel: 'DOB from',
      longLabel: 'Date of birth from',
    },
    dateOfBirthTo: {
      shortLabel: 'DOB to',
      longLabel: 'Date of birth to',
    },
    dateOfBirthExact: {
      shortLabel: 'DOB exact',
      longLabel: 'Date of birth exact',
    },
    dateOfDeath: {
      shortLabel: 'Death',
      longLabel: 'Date of death',
    },
    villageId: {
      shortLabel: 'Village',
      longLabel: 'Village',
      hidden: false,
    },
  },
};
storiesOf('SearchBar', module)
  .addDecorator(story => (
    <DumbLocalisationProvider reduxLocalisation={localisationData}>
      {story()}
    </DumbLocalisationProvider>
  ))
  .add('AllPatientSearchBar', () => <AllPatientsSearchBar onSearch={action('search')} />)
  .add('AppointmentsSearchBar', () => <AppointmentsSearchBar onSearch={action('search')} />)
  .add('CovidPatientsSearchBar', () => <CovidPatientsSearchBar onSearch={action('search')} />)
  .add('ImagingRequestsSearchBar', () => <ImagingRequestsSearchBar onSearch={action('search')} />)
  .add('ImmunisationSearchBar', () => <ImmunisationSearchBar onSearch={action('search')} />)
  .add('InvoicesSearchBar', () => <InvoicesSearchBar onSearch={action('search')} />)
  .add('LabRequestsSearchBar', () => <LabRequestsSearchBar onSearch={action('search')} />)
  .add('PatientSearchBar', () => <PatientSearchBar onSearch={action('search')} />);
