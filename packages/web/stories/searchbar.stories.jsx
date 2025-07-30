import React from 'react';
import { action } from 'storybook/actions';
import Box from '@material-ui/core/Box';
import {
  AllPatientsSearchBar,
  CovidPatientsSearchBar,
  ImagingRequestsSearchBar,
  ImmunisationSearchBar,
  LabRequestsSearchBar,
  PatientSearchBar,
} from '../app/components';

export default {
  title: 'SearchBar',
  component: AllPatientsSearchBar,
  decorators: [
    Story => (
      <Box maxWidth={1120}>
        <Story />
      </Box>
    ),
  ],
};

const AllPatientsTemplate = args => <AllPatientsSearchBar onSearch={action('search')} {...args} />;
export const AllPatients = AllPatientsTemplate.bind({});

const CovidPatientsTemplate = args => (
  <CovidPatientsSearchBar onSearch={action('search')} {...args} />
);
export const CovidPatients = CovidPatientsTemplate.bind({});

const ImagingRequestsTemplate = args => (
  <ImagingRequestsSearchBar onSearch={action('search')} {...args} />
);
export const ImagingRequests = ImagingRequestsTemplate.bind({});

const ImmunisationTemplate = args => (
  <ImmunisationSearchBar onSearch={action('search')} {...args} />
);
export const Immunisation = ImmunisationTemplate.bind({});

const LabRequestsTemplate = args => <LabRequestsSearchBar onSearch={action('search')} {...args} />;
export const LabRequests = LabRequestsTemplate.bind({});

const PatientTemplate = args => <PatientSearchBar onSearch={action('search')} {...args} />;
export const Patient = PatientTemplate.bind({});
