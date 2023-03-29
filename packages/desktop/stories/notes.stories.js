import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { storiesOf } from '@storybook/react';
import { HandoverNotesPDF } from 'shared/utils/handoverNotes';
import styled from 'styled-components';
import { createDummyPatient } from 'shared/demoData';
import { FormGrid } from '../app/components/FormGrid';
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

function refreshLabRequest() {
  console.log('refresh...');
}

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

storiesOf('Notes', module).add('LabRequestNotesForm', () => (
  <MockedApi endpoints={endpoints}>
    <Container>
      <FormGrid columns={3}>
        <LabRequestNoteForm
          labRequest={{ id: '123', status: 'cancelled' }}
          refreshLabRequest={refreshLabRequest}
        />
      </FormGrid>
    </Container>
  </MockedApi>
));

storiesOf('Notes', module).add('Handover notes PDF', () => (
  <PDFViewer width={800} height={1000} showToolbar={false}>
    <HandoverNotesPDF
      handoverNotes={handoverNotes}
      logoSrc={Logo}
      getLocalisation={getLocalisation}
      location="Female ward"
    />
  </PDFViewer>
));
