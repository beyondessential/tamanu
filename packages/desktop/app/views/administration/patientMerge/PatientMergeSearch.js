import React, { useState, useCallback } from 'react';
import { Button, TextInput } from "../../../components";
import { PatientSummary } from './PatientSummary';
import styled from 'styled-components';

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  > * {
    margin-right: 1rem;
  }
`;

export const PatientFetcher = ({
  fetchPatient,
  onPatientFound,
  label,
}) => {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [searchText, setSearchText] = useState('');

  const onClick = useCallback(() => {
    const patient = fetchPatient(searchText);
    setCurrentPatient(patient);
    onPatientFound(patient);
  });

  return (
    <div>
      <Row>
      <TextInput label={label} value={searchText} onChange={e => setSearchText(e.target.value)} />
      <Button onClick={onClick}>Get</Button>
      </Row>
      <PatientSummary heading="Patient" patient={currentPatient || {}} />
    </div>
  )
}

export const PatientMergeSearch = ({
  fetchPatient,
  onBeginMerge,
}) => {
  const [firstPatient, setFirstPatient] = useState();
  const [secondPatient, setSecondPatient] = useState();
  return (
    <div>
      <PatientFetcher 
        label="First patient display ID"
        fetchPatient={fetchPatient}
        onPatientFound={setFirstPatient}
      />
      <PatientFetcher 
        label="Second patient display ID"
        fetchPatient={fetchPatient}
        onPatientFound={setSecondPatient}
      />      
      <Button 
        disabled={!(firstPatient && secondPatient)}
        onClick={() => onBeginMerge(firstPatient, secondPatient)}
      >Merge</Button>
    </div>
  )
};