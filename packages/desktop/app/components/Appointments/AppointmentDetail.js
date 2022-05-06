import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import Select from 'react-select';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton } from '@material-ui/core';
import { APPOINTMENT_STATUSES } from 'shared/constants';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { InvertedDisplayIdLabel } from '../DisplayIdLabel';
import { DateDisplay } from '../DateDisplay';
import { Colors, appointmentStatusOptions } from '../../constants';
import { useApi } from '../../api';
import { AppointmentModal } from './AppointmentModal';
import { Button, DeleteButton } from '../Button';
import { Modal } from '../Modal';

const Heading = styled.div`
  font-weight: 700;
  margin-top: 0.5rem;
  margin-bottom: 0.35rem;
`;

const PatientInfoContainer = styled.div`
  border: 2px solid ${Colors.outline};
  padding: 1rem 0.75rem;
`;

const PatientNameRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const PatientName = styled.div`
  font-weight: 700;
  font-size: 1.3;
`;

const PatientInfoLabel = styled.td`
  padding-right: 1rem;
  color: ${Colors.midText};
`;

const PatientInfoValue = styled.td`
  text-transform: capitalize;
`;

const PatientInfo = ({ patient }) => {
  const api = useApi();
  const { id, displayId, sex, dateOfBirth, village } = patient;
  const [additionalData, setAdditionalData] = useState();
  useEffect(() => {
    (async () => {
      const data = await api.get(`/patient/${id}/additionalData`);
      setAdditionalData(data);
    })();
  }, [id, api]);
  return (
    <PatientInfoContainer>
      <PatientNameRow>
        <PatientName>
          <PatientNameDisplay patient={patient} />
        </PatientName>
        <InvertedDisplayIdLabel>{displayId}</InvertedDisplayIdLabel>
      </PatientNameRow>
      <table>
        <tbody>
          <tr>
            <PatientInfoLabel>Sex</PatientInfoLabel>
            <PatientInfoValue>{sex}</PatientInfoValue>
          </tr>
          <tr>
            <PatientInfoLabel>Date of Birth</PatientInfoLabel>
            <PatientInfoValue>
              <DateDisplay date={dateOfBirth} />
            </PatientInfoValue>
          </tr>
          {additionalData && additionalData.primaryContactNumber && (
            <tr>
              <PatientInfoLabel>Contact Number</PatientInfoLabel>
              <PatientInfoValue>{additionalData.primaryContactNumber}</PatientInfoValue>
            </tr>
          )}
          {village && (
            <tr>
              <PatientInfoLabel>Village</PatientInfoLabel>
              <PatientInfoValue>{village.name}</PatientInfoValue>
            </tr>
          )}
        </tbody>
      </table>
    </PatientInfoContainer>
  );
};

const AppointmentTime = ({ startTime, endTime }) => (
  <span>
    {format(new Date(startTime), 'ccc dd LLL')}
    {' - '}
    {format(new Date(startTime), 'h:mm aaa')}
    {endTime && ` - ${format(new Date(endTime), 'h:mm aaa')}`}
  </span>
);

const Row = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const Details = styled.div`
  margin-bottom: 1rem;
`;

const CancelAppointmentModal = ({ open, onClose, onConfirm, appointment }) => {
  const { type, patient } = appointment;
  return (
    <Modal width="sm" title="Cancel Appointment" onClose={onClose} open={open}>
      <Heading>Are you sure you want to cancel this appointment?</Heading>
      <Details>
        {`${type} appointment for `}
        <PatientNameDisplay patient={patient} />
        {' - '}
        <AppointmentTime {...appointment} />
      </Details>
      <Row>
        <DeleteButton onClick={onConfirm}>Yes, Cancel</DeleteButton>
      </Row>
    </Modal>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 0.5rem;
  padding: 0.2rem 0 1rem;
`;

const Section = styled.div`
  margin-bottom: 0.5rem;
`;

const FirstRow = styled(Section)`
  display: grid;
  grid-template-columns: 1fr 8rem;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${Colors.outline};
  column-gap: 2rem;
`;

const CloseButtonSection = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const StyledIconButton = styled(IconButton)`
  padding: 0;
`;

export const AppointmentDetail = ({ appointment, onUpdated, onClose }) => {
  const api = useApi();
  const { id, type, status, clinician, patient, location } = appointment;
  const [statusOption, setStatusOption] = useState(
    appointmentStatusOptions.find(option => option.value === status),
  );
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setStatusOption(appointmentStatusOptions.find(option => option.value === status));
  }, [status]);

  const updateAppointmentStatus = async newValue => {
    await api.put(`appointments/${id}`, {
      status: newValue,
    });
    onUpdated();
  };
  return (
    <Container>
      <CloseButtonSection>
        <StyledIconButton onClick={onClose}>
          <CloseIcon />
        </StyledIconButton>
      </CloseButtonSection>
      {errorMessage && <Section>{errorMessage}</Section>}
      <FirstRow>
        <div>
          <Heading>Type</Heading>
          {type}
          <Heading>Time</Heading>
          <div>
            <AppointmentTime {...appointment} />
          </div>
        </div>
        <Select
          placeholder="Select Status"
          options={appointmentStatusOptions}
          value={statusOption}
          name="status"
          onChange={async selectedOption => {
            if (selectedOption.value === APPOINTMENT_STATUSES.CANCELLED && !cancelConfirmed) {
              setCancelModal(true);
              return;
            }
            setStatusOption(selectedOption);
            await updateAppointmentStatus(selectedOption.value);
          }}
        />
      </FirstRow>
      <Section>
        <Heading>Clinician</Heading>
        {clinician.displayName}
      </Section>
      <PatientInfo patient={patient} />
      <Section>
        <Heading>Location</Heading>
        {location.name}
      </Section>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => {
          setAppointmentModal(true);
        }}
      >
        Reschedule
      </Button>
      <AppointmentModal
        open={appointmentModal}
        onClose={() => {
          setAppointmentModal(false);
        }}
        appointment={appointment}
        onSuccess={() => {
          onUpdated();
        }}
      />
      <CancelAppointmentModal
        appointment={appointment}
        open={cancelModal}
        onClose={() => {
          setCancelModal(false);
        }}
        onConfirm={async () => {
          setCancelConfirmed(true);
          try {
            await updateAppointmentStatus(APPOINTMENT_STATUSES.CANCELLED);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
            setErrorMessage('Unable to cancel appointment. Please try again.');
          }
          setCancelConfirmed(false);
          setCancelModal(false);
        }}
      />
    </Container>
  );
};
