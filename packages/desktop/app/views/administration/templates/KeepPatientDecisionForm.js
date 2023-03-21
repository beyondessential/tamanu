import React, { useState } from 'react';
import styled from 'styled-components';

import { ConfirmCancelRow, Modal } from '../../../components';

import { PatientSummary } from './PatientSummary';

const MainInstruction = styled.p`
  font-weight: bold;
`;

const SelectInstructions = () => (
  <div>
    <MainInstruction>Select which version of the patient should be kept.</MainInstruction>
    <p>
      Basic data, including name, patient ID, DOB, sex, location, blood type and contact details
      will be retained from the selected patient record only. Clinical information such as
      encounters, allergies, existing conditions and family history will be retained from both
      patient records.
    </p>
  </div>
);

export const KeepPatientDecisionForm = ({
  firstPatient,
  secondPatient,
  onCancel,
  onSelectPlan,
}) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const actions = (
    <ConfirmCancelRow
      confirmText="Next"
      confirmDisabled={!selectedPatient}
      onConfirm={() => {
        const patientToRemove = selectedPatient === firstPatient ? secondPatient : firstPatient;
        onSelectPlan({
          keepPatient: selectedPatient,
          removePatient: patientToRemove,
        });
      }}
      onCancel={onCancel}
    />
  );
  return (
    <Modal title="Merge patients" actions={actions} open onClose={onCancel}>
      <SelectInstructions />
      <PatientSummary
        patient={firstPatient}
        onSelect={() => setSelectedPatient(firstPatient)}
        selected={selectedPatient === firstPatient}
      />
      <PatientSummary
        patient={secondPatient}
        onSelect={() => setSelectedPatient(secondPatient)}
        selected={selectedPatient === secondPatient}
      />
    </Modal>
  );
};
