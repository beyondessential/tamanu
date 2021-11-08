import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { SelectInput } from '../Field';
import { PatientNameDisplay } from '../PatientNameDisplay';
import { InvertedDisplayIdLabel } from '../DisplayIdLabel';
import { DateDisplay } from '../DateDisplay';
import { Colors, appointmentStatusOptions } from '../../constants';
import { useApi } from '../../api';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
  padding: 1rem 0;
`;

const FirstRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 8rem;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${Colors.outline};
  column-gap: 2rem;
`;

const Heading = styled.div`
  font-weight: 700;
  font-size: 1.1;
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
  return (
    <PatientInfoContainer>
      <PatientNameRow>
        <PatientName>
          <PatientNameDisplay patient={patient} />
        </PatientName>
        <InvertedDisplayIdLabel>{patient.displayId}</InvertedDisplayIdLabel>
      </PatientNameRow>
      <table>
        <tr>
          <PatientInfoLabel>Sex</PatientInfoLabel>
          <PatientInfoValue>{patient.sex}</PatientInfoValue>
        </tr>
        <tr>
          <PatientInfoLabel>Date of Birth</PatientInfoLabel>
          <PatientInfoValue>
            <DateDisplay date={patient.dateOfBirth} />
          </PatientInfoValue>
        </tr>
      </table>
    </PatientInfoContainer>
  );
};

export const AppointmentDetail = ({ appointment, updated }) => {
  const api = useApi();
  const { id, type, status, clinician, startTime, endTime, patient, location } = appointment;
  const [newStatus, setNewStatus] = useState(status);
  useEffect(() => {
    (async () => {
      await api.put(`appointments/${id}`, {
        status: newStatus,
      });
      updated();
    })();
  }, [newStatus]);
  return (
    <Container>
      <FirstRow>
        <div>
          <Heading>{type}</Heading>
          <div>
            {format(new Date(startTime), 'ccc dd LLL')}
            {' - '}
            {format(new Date(startTime), 'h:mm aaa')}
            {endTime && ` - ${format(new Date(endTime), 'h:mm aaa')}`}
          </div>
        </div>
        <SelectInput
          placeholder="Select Status"
          options={appointmentStatusOptions}
          value={newStatus}
          onChange={e => {
            setNewStatus(e.target.value);
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
    </Container>
  );
};
