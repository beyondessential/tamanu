import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../contexts/Translation';
import { getPatientDataDisplayValue } from '../../utils/survey';
import { useApi } from '../../api/useApi';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: ${props => props.$marginBottom};
`;

export const PatientDataDisplayField = ({ config, label, value }) => {
  const api = useApi();
  const { getEnumTranslation, getReferenceDataTranslation } = useTranslation();
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    getPatientDataDisplayValue({
      api,
      getEnumTranslation,
      getReferenceDataTranslation,
      value,
      config,
    }).then(setDisplayValue);
  }, []);

  return (
    <Container $marginBottom={label ? '10px' : '0px'}>
      {label && <div>{label}</div>}
      <div>{displayValue}</div>
    </Container>
  );
};
