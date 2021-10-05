import React from 'react';
import styled from 'styled-components';

import { PageContainer, TopBar } from '../../components';
import { NewAppointmentForm } from '../../components/Appointments/NewAppointmentForm';

const Container = styled.div`
  margin: 1rem;
`;

export const NewAppointmentView = () => (
  <PageContainer>
    <TopBar title="New Appointment" />
    <Container>
      <NewAppointmentForm />
    </Container>
  </PageContainer>
);
