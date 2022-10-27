import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { Colors, SEX_VALUE_INDEX } from '../../../constants';
import { DateDisplay } from '../../../components';
import { getPatientNameAsString } from '../../../components/PatientNameDisplay';

const Container = styled.div`
  border-bottom: 1px solid ${Colors.outline};
  background: ${Colors.white};
  padding: 16px 30px 28px;
`;

const SectionLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
  margin-bottom: 10px;
  letter-spacing: 0;
`;

const PatientCard = ({ patient }) => {
  return (
    <Container>
      <Typography>
        <strong>{getPatientNameAsString(patient)}</strong>
      </Typography>
      <Typography>{patient.displayId}</Typography>
      <Typography>{SEX_VALUE_INDEX[patient.sex].label}</Typography>
      <DateDisplay date={patient.dateOfBirth} />
    </Container>
  );
};

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const RecentPatientSection = () => {
  const cards = [1, 2, 3, 4, 5, 6];
  return (
    <>
      <SectionLabel>Recent patients</SectionLabel>
      <CardContainer>
        {cards.map(a => (
          <PatientCard
            patient={{
              firstName: `Test-${a}`,
              lastName: 'Patient',
              sex: 'female',
              dateOfBirth: '12/12/2012',
              displayId: 'ABCD123456',
            }}
          />
        ))}
      </CardContainer>
    </>
  );
};
