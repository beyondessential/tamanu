import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getPatientDataDisplayValue } from '../../utils';
import { useTranslation, useApi, useDateTimeFormat } from '../../contexts';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: ${props => props.$marginBottom};
`;

export const PatientDataDisplayField = ({ config, label, value }) => {
  const api = useApi();
  const { formatShort } = useDateTimeFormat();
  const { getEnumTranslation, getReferenceDataTranslation } = useTranslation();
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    getPatientDataDisplayValue({
      api,
      getEnumTranslation,
      getReferenceDataTranslation,
      formatShort,
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
