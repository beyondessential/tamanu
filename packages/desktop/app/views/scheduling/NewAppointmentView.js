import React, { useState } from 'react';
import styled from 'styled-components';

import { PageContainer, TopBar } from '../../components';
import { Notification } from '../../components/Notification';
import { Button } from '../../components/Button';
import { NewAppointmentForm } from '../../components/Appointments/NewAppointmentForm';

const Container = styled.div`
  margin: 1rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const NewAppointmentView = () => {
  const [success, setSuccess] = useState(false);
  return (
    <PageContainer>
      <TopBar title="New Appointment" />
      <Container>
        {success && (
          <>
            <Notification message="Appointment created successfully." />
            <ButtonRow>
              <Button variant="contained" color="primary" onClick={() => setSuccess(false)}>
                Add another appointment
              </Button>
            </ButtonRow>
          </>
        )}
        {!success && (
          <NewAppointmentForm
            onSuccess={() => {
              setSuccess(true);
            }}
          />
        )}
      </Container>
    </PageContainer>
  );
};
