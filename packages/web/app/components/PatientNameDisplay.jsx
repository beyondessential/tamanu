import React from 'react';

export const getPatientNameAsString = ({ firstName, lastName }) =>
  [firstName, lastName].filter(Boolean).join(' ');

export const PatientNameDisplay = ({ patient }) => <span>{getPatientNameAsString(patient)}</span>;
