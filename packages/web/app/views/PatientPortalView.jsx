import React from 'react';
import { useParams } from 'react-router-dom';

export const PatientPortalView = () => {
  const { patientId } = useParams();

  return (
    <div>
      <p>Patient ID: {patientId}</p>
      {/* TODO: Add patient portal content */}
    </div>
  );
};