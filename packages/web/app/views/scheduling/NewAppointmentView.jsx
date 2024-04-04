import React, { useState } from 'react';
import styled from 'styled-components';
import { ContentPane, PageContainer, TopBar } from '../../components';
import { Notification } from '../../components/Notification';
import { Button } from '../../components/Button';
import { AppointmentForm } from '../../components/Appointments/AppointmentForm';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useAuth } from '../../contexts/Auth';
import { ErrorMessage } from '../../components/ErrorMessage';

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SubmissionSuccess = ({ onReset }) => (
  <>
    <Notification
      message={
        <TranslatedText
          stringId="scheduling.newAppointment.successMessage"
          fallback="Appointment created successfully."
        />
      }
    />
    <ButtonRow>
      <Button variant="contained" color="primary" onClick={onReset}>
        <TranslatedText
          stringId="scheduling.newAppointment.action.addAnotherAppointment"
          fallback="Add another appointment"
        />
      </Button>
    </ButtonRow>
  </>
);

export const NewAppointmentView = () => {
  const [success, setSuccess] = useState(false);
  const { ability } = useAuth();

  const hasPermission = typeof ability.can === 'function' && ability.can('write', 'Appointment');

  return (
    <PageContainer>
      <TopBar
        title={
          <TranslatedText stringId="scheduling.newAppointment.title" fallback="New appointment" />
        }
      />
      <ContentPane>
        {!hasPermission ? (
          <ErrorMessage
            title={
              <TranslatedText stringId="general.error.noPermission" fallback="No permission" />
            }
            errorMessage={
              <TranslatedText
                stringId="scheduling.newAppointment.error.noPermission"
                fallback="You do not have permission to create a new appointment. If you require access, please contact your administrator."
              />
            }
          />
        ) : success ? (
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
