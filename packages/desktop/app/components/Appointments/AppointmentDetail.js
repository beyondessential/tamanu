import React, { useState } from 'react';
import styled from 'styled-components';
import { SelectInput } from '../Field';
import { Colors, appointmentStatusOptions } from '../../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const FirstRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 8rem;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${Colors.outline};
`;

export const AppointmentDetail = ({ appointment }) => {
  const { type, status, clinician } = appointment;
  const [newStatus, setNewStatus] = useState(status);
  return (
    <Container>
      <FirstRow>
        {type}
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
        {clinician.displayName}
      </div>
    </Container>
  );
};
