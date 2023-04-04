import React, { useCallback, useEffect, useState } from 'react';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { format } from 'date-fns';
import Select from 'react-select';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { APPOINTMENT_STATUSES } from 'shared/constants';
import { useQuery } from '@tanstack/react-query';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { TextDisplayIdLabel } from '../DisplayIdLabel';
import { DateDisplay } from '../DateDisplay';
import { Colors, appointmentStatusOptions } from '../../constants';
import { useApi } from '../../api';
import { reloadPatient } from '../../store/patient';
import { AppointmentModal } from './AppointmentModal';
import { Button, DeleteButton } from '../Button';
import { Modal } from '../Modal';
import { EncounterModal } from '../EncounterModal';
import { usePatientCurrentEncounter } from '../../api/queries';

const Heading = styled.div`
  font-weight: 700;
  margin-top: 0.5rem;
  margin-bottom: 0.35rem;
`;

const PatientInfoContainer = styled.div`
  border: 2px solid ${Colors.outline};
  padding: 1rem 0.75rem;

  &:hover {
    background-color: ${Colors.veryLightBlue};
    cursor: pointer;
  }
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
  const dispatch = useDispatch();
  const { id, displayId, sex, dateOfBirth, village } = patient;
  const [additionalData, setAdditionalData] = useState();
  useEffect(() => {
    (async () => {
      const data = await api.get(`/patient/${id}/additionalData`);
      setAdditionalData(data);
    })();
  }, [id, api]);

  const handlePatientInfoContainerClick = useCallback(async () => {
    await dispatch(reloadPatient(id));
    dispatch(push(`/patients/all/${id}`));
  }, [dispatch, id]);

  return (
    <PatientInfoContainer onClick={handlePatientInfoContainerClick}>
      <PatientNameRow>
        <PatientName>
          <PatientNameDisplay patient={patient} />
        </PatientName>
        <TextDisplayIdLabel>{displayId}</TextDisplayIdLabel>
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
  const { id, type, status, clinician, patient, locationGroup } = appointment;
  const {
    data: currentEncounter,
    error: currentEncounterError,
    isLoading: currentEncounterLoading,
  } = usePatientCurrentEncounter(patient.id);

  const { data: additionalData, isLoading: additionalDataLoading } = useQuery(
    ['additionalData', patient.id],
    () => api.get(`patient/${patient.id}/additionalData`),
  );
  const [statusOption, setStatusOption] = useState(
    appointmentStatusOptions.find(option => option.value === status),
  );
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [encounterModal, setEncounterModal] = useState(false);
  const [createdEncounter, setCreatedEncounter] = useState();
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  useEffect(() => {
    setStatusOption(appointmentStatusOptions.find(option => option.value === status));
  }, [status]);

  useEffect(() => {
    if (currentEncounterError) {
      setShowErrorAlert(true);
    }
  }, [currentEncounterError]);

  const updateAppointmentStatus = useCallback(
    async newValue => {
      await api.put(`appointments/${id}`, {
        status: newValue,
      });
      onUpdated();
    },
    [api, id, onUpdated],
  );

  const onOpenAppointmentModal = useCallback(() => setAppointmentModal(true), []);
  const onCloseAppointmentModal = useCallback(() => setAppointmentModal(false), []);
  const onOpenEncounterModal = useCallback(() => setEncounterModal(true), []);
  const onCloseEncounterModal = useCallback(() => setEncounterModal(false), []);
  const onSubmitEncounterModal = useCallback(
    async encounter => {
      setCreatedEncounter(encounter);
      onCloseEncounterModal();
    },
    [onCloseEncounterModal],
  );

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
          styles={{
            valueContainer: baseStyles => ({
              ...baseStyles,
              color: Colors.white,
            }),
            dropdownIndicator: baseStyles => ({
              ...baseStyles,
              color: Colors.white,
            }),
            singleValue: baseStyles => ({
              ...baseStyles,
              color: Colors.white,
            }),
            control: baseStyles => ({
              ...baseStyles,
              backgroundColor: Colors.primary,
              color: Colors.white,
              borderColor: 'transparent',
            }),
            menu: baseStyles => ({
              ...baseStyles,
              backgroundColor: Colors.primary,
              color: Colors.white,
            }),
            option: (baseStyles, state) => ({
              ...baseStyles,
              backgroundColor: (state.isSelected || state.isFocused) && Colors.veryLightBlue,
              color: (state.isSelected || state.isFocused) && Colors.darkText,
            }),
          }}
        />
      </FirstRow>
      <Section>
        <Heading>Clinician</Heading>
        {clinician.displayName}
      </Section>
      <PatientInfo patient={patient} />
      <Section>
        <Heading>Area</Heading>
        {locationGroup.name}
      </Section>
      <Button variant="outlined" color="primary" onClick={onOpenAppointmentModal}>
        Reschedule
      </Button>
      {!currentEncounter &&
        !currentEncounterError &&
        !currentEncounterLoading &&
        !additionalDataLoading &&
        !createdEncounter && (
          <Button variant="text" color="primary" onClick={onOpenEncounterModal}>
            <u>Admit or check-in</u>
          </Button>
        )}
      {showErrorAlert && (
        <Alert
          severity="error"
          style={{ marginBottom: 20 }}
          onClose={() => {
            setShowErrorAlert(false);
          }}
        >
          Error: There was an error loading the current encounter
        </Alert>
      )}
      <AppointmentModal
        open={appointmentModal}
        onClose={onCloseAppointmentModal}
        appointment={appointment}
        onSuccess={() => {
          onUpdated();
        }}
      />
      {!additionalDataLoading && (
        <EncounterModal
          open={encounterModal}
          onClose={onCloseEncounterModal}
          onSubmitEncounter={onSubmitEncounterModal}
          noRedirectOnSubmit
          patient={patient}
          patientBillingTypeId={additionalData?.patientBillingTypeId}
        />
      )}
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
