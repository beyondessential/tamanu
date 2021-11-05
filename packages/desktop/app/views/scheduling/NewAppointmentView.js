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

const SubmissionSuccess = ({ onReset }) => (
  <>
    <Notification message="Appointment created successfully." />
    <ButtonRow>
      <Button variant="contained" color="primary" onClick={onReset}>
        Add another appointment
      </Button>
    </ButtonRow>
  </>
);

export const NewAppointmentView = () => {
  const [success, setSuccess] = useState(false);
  return (
    <PageContainer>
      <TopBar title="New appointment" />
      <Container>
        {success ? (
          <SubmissionSuccess onReset={() => setSuccess(false)} />
        ) : (
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
