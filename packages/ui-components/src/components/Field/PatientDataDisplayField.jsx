import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { usePatientDataDisplayValue } from '../../hooks';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: ${props => props.$marginBottom};
`;

export const PatientDataDisplayField = ({ config, label, value }) => {
  const { getDisplayValue } = usePatientDataDisplayValue();
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    getDisplayValue({ value, config }).then(setDisplayValue);
  }, [getDisplayValue, value, config]);

  return (
    <Container $marginBottom={label ? '10px' : '0px'}>
      {label && <div>{label}</div>}
      <div>{displayValue}</div>
    </Container>
  );
};
