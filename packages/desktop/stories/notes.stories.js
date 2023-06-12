import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { HandoverNotesPDF } from 'shared/utils/handoverNotes';
import styled from 'styled-components';
import { createDummyPatient } from 'shared/demoData';
import { LabRequestNoteForm } from '../app/forms/LabRequestNoteForm';
import Logo from './assets/tamanu-logo.png';
import { MockedApi } from './utils/mockedApi';

const Container = styled.div`
  max-width: 600px;
  padding: 1rem;
`;

const getLocalisation = key => {
  const config = {
    'templates.letterhead.title': 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
    'templates.letterhead.subTitle': 'PO Box 12345, Melbourne, Australia',
    'templates.vaccineCertificate.emailAddress': 'tamanu@health.govt',
    'templates.vaccineCertificate.contactNumber': '123456',
    'fields.firstName.longLabel': 'First Name',
    'fields.lastName.longLabel': 'Last Name',
    'fields.dateOfBirth.longLabel': 'Date of Birth',
    'fields.sex.longLabel': 'Sex',
    previewUvciFormat: 'tamanu',
  };
  return config[key];
};

const handoverNotes = [
  {
    patient: createDummyPatient(),
    diagnosis: 'Diabetes (Confirmed), Pneumonia (For investigation)',
    location: 'Bed 1',
    notes: `Notes: This is a full width note from Tamanu with line breaks This is a full width note from Tamanu with line breaksThis is a full width note from Tamanu with line breaks
  This is a full width note from Tamanu with line breaks This is a full width note from Tamanu with line breaks`,
    createdAt: new Date(),
  },
  {
    patient: createDummyPatient(),
    diagnosis: 'Diabetes (Confirmed), Pneumonia (For investigation)',
    location: 'Bed 1',
    notes: `This is a full width note from Tamanu with line breaks This is a full width note from Tamanu with line breaks`,
    createdAt: new Date(),
  },
  {
    patient: createDummyPatient(),
    diagnosis: 'Diabetes (Confirmed), Pneumonia (For investigation)',
    location: 'Bed 1',
  },
  {
    patient: createDummyPatient(),
    diagnosis: 'Diabetes (Confirmed), Pneumonia (For investigation)',
    location: 'Bed 1',
  },
];

const endpoints = {
  'labRequest/:id/notes': () => {
    return { data: [{ id: '1', content: 'LabRequest Cancelled. Reason: Clinical Reason.' }] };
  },
};

export default {
  title: 'Notes',
  component: LabRequestNoteForm,
  decorators: [
    Story => (
      <MockedApi endpoints={endpoints}>
        <Container>
          <Story />
        </Container>
      </MockedApi>
    ),
  ],
};

const Template = args => <LabRequestNoteForm {...args} />;

export const LabRequestForm = Template.bind({});
LabRequestForm.args = {
  labRequestId: '1234',
  isReadOnly: false,
};

const PDFTemplate = args => (
  <PDFViewer {...args}>
    <HandoverNotesPDF
      handoverNotes={handoverNotes}
      logoSrc={Logo}
      getLocalisation={getLocalisation}
      locationGroupName="A-Emergency Department"
    />
  </PDFViewer>
);

export const HandoverNotes = PDFTemplate.bind({});
HandoverNotes.args = {
  width: 800,
  height: 1000,
  showToolbar: false,
};
