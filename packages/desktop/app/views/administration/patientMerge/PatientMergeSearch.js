import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Button, TextInput } from '../../../components';
import { PatientSummary } from './PatientSummary';

import { useApi } from '../../../api';

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  > * {
    margin-right: 1rem;
  }
`;

export const PatientFetcher = ({ onPatientFound, label }) => {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [searchText, setSearchText] = useState('');

  const api = useApi();

  const onClick = useCallback(async () => {
    setCurrentPatient(null);
    onPatientFound(null);
    const patient = await api.get(`admin/lookup/patient/${searchText}`);
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
  );
};

const MergeFrame = styled.div`
  display: flex;
  flex-direction: column;
  margin: 1rem;
  > * {
    margin-bottom: 2rem;
  }
`;

export const PatientMergeSearch = ({ onBeginMerge }) => {
  const [firstPatient, setFirstPatient] = useState();
  const [secondPatient, setSecondPatient] = useState();
  return (
    <MergeFrame>
      <h3>Select patients to merge</h3>
      <PatientFetcher label="First patient display ID" onPatientFound={setFirstPatient} />
      <PatientFetcher label="Second patient display ID" onPatientFound={setSecondPatient} />
      <Button
        disabled={!(firstPatient && secondPatient)}
        onClick={() => onBeginMerge(firstPatient, secondPatient)}
      >
        Merge
      </Button>
    </MergeFrame>
  );
};
