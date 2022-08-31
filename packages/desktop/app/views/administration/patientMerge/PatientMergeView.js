import React from 'react';

export const PatientMergeForm = ({
  getPatientName,
  onSubmit,
}) => {
  return (
    <div>
      <div>{getPatientName("boBo")}</div>
      <div>select patient to merge</div>
      <div>ok</div>
    </div>
  );
};

export const PatientMergeView = () => {
  return (
    <PatientMergeForm
      getPatientName={(displayId) => displayId ? "none" : `NN-${displayId.toLowerCase()}`}
      onSubmit={(data) => null}
    />
  );
};