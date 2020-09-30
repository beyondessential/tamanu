import React from 'react';

export const PatientNameDisplay = ({ patient }) => (
  <span>{`${patient.firstName} ${patient.lastName}`}</span>
);
