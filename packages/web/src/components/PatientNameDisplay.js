import React from 'react';

export const getPatientNameAsString = ({ firstName, lastName }) => `${firstName} ${lastName}`;

export const PatientNameDisplay = ({ patient }) => <span>{getPatientNameAsString(patient)}</span>;
