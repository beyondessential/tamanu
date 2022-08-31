import React, { useState, useCallback } from 'react';
import { Button } from "../../../components";

export const PatientFetcher = ({
  fetchPatient,
  onPatientFound
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
      <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} />
      <Button onClick={onClick}>Get</Button>
      <div>{currentPatient ? currentPatient.id : 'waiting'}</div>
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
        fetchPatient={fetchPatient}
        onPatientFound={setFirstPatient}
      />
      <PatientFetcher 
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