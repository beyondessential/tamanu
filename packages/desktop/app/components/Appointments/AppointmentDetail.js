import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import Select from 'react-select';
import Tooltip from 'react-tooltip';
import { APPOINTMENT_STATUSES } from 'shared/constants';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { InvertedDisplayIdLabel } from '../DisplayIdLabel';
import { DateDisplay } from '../DateDisplay';
import { Colors, appointmentStatusOptions } from '../../constants';
import { useApi } from '../../api';
import { AppointmentModal } from './AppointmentModal';
import { Button } from '..';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 0.5rem;
  padding: 1rem 0;
`;

const FirstRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 8rem;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${Colors.outline};
  column-gap: 2rem;
`;

const Heading = styled.div`
  font-weight: 700;
  font-size: 1.1;
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
  }, [id]);
  return (
    <PatientInfoContainer>
      <PatientNameRow>
        <PatientName>
          <PatientNameDisplay patient={patient} />
        </PatientName>
        <InvertedDisplayIdLabel>{displayId}</InvertedDisplayIdLabel>
      </PatientNameRow>
      <table>
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
      </table>
    </PatientInfoContainer>
  );
};

export const AppointmentDetail = ({ appointment, updated }) => {
  const api = useApi();
  const { id, type, status, clinician, startTime, endTime, patient, location } = appointment;
  const [newStatus, setNewStatus] = useState(
    appointmentStatusOptions.find(option => option.value === status),
  );
  const [openModal, setOpenModal] = useState(false);
  useEffect(() => {
    setNewStatus(appointmentStatusOptions.find(option => option.value === status));
  }, [status]);
  return (
    <Container>
      <FirstRow>
        <div>
          <Heading>Type</Heading>
          {type}
          <Heading>Time</Heading>
          <div>
            {format(new Date(startTime), 'ccc dd LLL')}
            {' - '}
            {format(new Date(startTime), 'h:mm aaa')}
            {endTime && ` - ${format(new Date(endTime), 'h:mm aaa')}`}
          </div>
        </div>
        <Select
          placeholder="Select Status"
          options={appointmentStatusOptions}
          value={newStatus}
          name="status"
          onChange={async selectedOption => {
            setNewStatus(selectedOption);
            await api.put(`appointments/${id}`, {
              status: selectedOption.value,
            });
            // hide the tooltip if cancelling appointment
            if (selectedOption.value === APPOINTMENT_STATUSES.CANCELLED) {
              Tooltip.hide();
            }
            updated();
          }}
        />
      </FirstRow>
      <div>
        <Heading>Clinician</Heading>
        {clinician.displayName}
      </div>
      <PatientInfo patient={patient} />
      <div>
        <Heading>Location</Heading>
        {location.name}
      </div>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => {
          setOpenModal(true);
        }}
      >
        Reschedule
      </Button>
      <AppointmentModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
        }}
        appointment={appointment}
        onSuccess={() => {
          Tooltip.hide();
          updated();
        }}
      />
    </Container>
  );
};
