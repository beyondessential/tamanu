import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { MockedApi } from './utils/mockedApi';
import { LabRequestNoteForm } from '../app/forms/LabRequestNoteForm';
import { FormGrid } from '../app/components/FormGrid';

const Container = styled.div`
  max-width: 600px;
  padding: 1rem;
`;

function refreshLabRequest() {
  console.log('refresh...');
}

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
