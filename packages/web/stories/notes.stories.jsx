import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { HandoverNotesPDF } from '@tamanu/shared/utils/handoverNotes';
import styled from 'styled-components';
import { createDummyPatient } from '@tamanu/database/demoData';
import { LabRequestNoteForm } from '../app/forms/LabRequestNoteForm';
import Logo from './assets/tamanu-logo.png';
import { MockedApi } from './utils/mockedApi';

const Container = styled.div`
  width: 600px;
  padding: 1rem;
`;

const letterheadConfig = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
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
    return {
      data: [
        {
          id: '1',
          content: 'LabRequest Cancelled. Reason: Clinical Reason.',
          author: { displayName: 'Catherine Jennings' },
          date: new Date(),
        },
        {
          id: '2',
          content: 'Patient discharged.',
          author: { displayName: 'Catherine Jennings' },
          date: new Date(),
        },
      ],
    };
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
      getLocalisation={() => undefined}
      locationGroupName="A-Emergency Department"
      letterheadConfig={letterheadConfig}
    />
  </PDFViewer>
);

export const HandoverNotes = PDFTemplate.bind({});
HandoverNotes.args = {
  width: 800,
  height: 1000,
  showToolbar: false,
};
