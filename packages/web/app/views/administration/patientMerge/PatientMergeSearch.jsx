import React, { useState } from 'react';
import styled from 'styled-components';
import { TextInput, Button, TranslatedText } from '@tamanu/ui-components';
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
  const [error, setError] = useState(null);

  const api = useApi();
  const clear = () => {
    setCurrentPatient(null);
    setError(null);
    onPatientFound(null);
  };

  const onClick = async () => {
    clear();
    try {
      const patient = await api.get(`admin/lookup/patient/${searchText}`);
      setCurrentPatient(patient);
      onPatientFound(patient);
    } catch (e) {
      setError(e);
    }
  };

  return (
    <div>
      <Row data-testid="row-3s8f">
        <TextInput
          label={label}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          data-testid="textinput-8k3u"
        />
        <Button onClick={onClick} data-testid="button-ozwr">
          <TranslatedText
            stringId="admin.patientMerge.action.get"
            fallback="Get"
            data-testid="translatedtext-0el5"
          />
        </Button>
      </Row>
      {error && (
        <pre>
          {error.name}: {error.message}
        </pre>
      )}
      <PatientSummary
        heading="Patient"
        patient={currentPatient || {}}
        data-testid="patientsummary-gc2y"
      />
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
    <MergeFrame data-testid="mergeframe-c33t">
      <h3>
        <TranslatedText
          stringId="admin.patientMerge.title"
          fallback="Select patients to merge"
          data-testid="translatedtext-3g37"
        />
      </h3>
      <PatientFetcher
        label={
          <TranslatedText
            stringId="admin.patientMerge.firstPatient.label"
            fallback="First patient display ID"
            data-testid="translatedtext-d3o0"
          />
        }
        onPatientFound={setFirstPatient}
        data-testid="patientfetcher-6jfb"
      />
      <PatientFetcher
        label={
          <TranslatedText
            stringId="admin.patientMerge.secondPatient.label"
            fallback="Second patient display ID"
            data-testid="translatedtext-8wqd"
          />
        }
        onPatientFound={setSecondPatient}
        data-testid="patientfetcher-rta7"
      />
      <Button
        disabled={!(firstPatient && secondPatient)}
        onClick={() => onBeginMerge(firstPatient, secondPatient)}
        data-testid="button-tnip"
      >
        <TranslatedText
          stringId="admin.patientMerge.action.merge"
          fallback="Merge"
          data-testid="translatedtext-dd21"
        />
      </Button>
    </MergeFrame>
  );
};
