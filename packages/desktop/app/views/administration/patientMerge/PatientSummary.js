import React from 'react';

export const PatientSummary = ({ patient, onSelect, selected }) => (
  <div onClick={onSelect}>
    <h3>Patient Details</h3>
    {onSelect && <input type="radio" checked={selected} />}
    {selected && <div>keep</div>}
    <div>Name: {patient.firstName} {patient.lastName}</div>
    <div>ID: {patient.displayId}</div>
  </div>
);