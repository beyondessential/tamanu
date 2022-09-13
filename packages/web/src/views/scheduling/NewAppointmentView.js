import React, { useState } from 'react';
import styled from 'styled-components';
import { PageContainer, ContentPane, TopBar } from '../../components';
import { Notification } from '../../components/Notification';
import { Button } from '../../components/Button';
import { AppointmentForm } from '../../components/Appointments/AppointmentForm';

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
      <ContentPane>
        {success ? (
          <SubmissionSuccess onReset={() => setSuccess(false)} />
        ) : (
          <AppointmentForm
            onSuccess={() => {
              setSuccess(true);
            }}
          />
        )}
      </ContentPane>
    </PageContainer>
  );
};
