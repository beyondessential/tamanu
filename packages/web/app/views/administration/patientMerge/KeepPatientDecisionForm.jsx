import React, { useState } from 'react';
import styled from 'styled-components';
import { ConfirmCancelRow, Modal } from '@tamanu/ui-components';
import { PatientSummary } from './PatientSummary';

const MainInstruction = styled.p`
  font-weight: bold;
`;

const SelectInstructions = () => (
  <div>
    <MainInstruction data-testid="maininstruction-h1si">
      Select which version of the patient should be kept.
    </MainInstruction>
    <p>
      Patient details recorded against the patient record to be kept, including name, sex, location,
      blood type and contact details will be retained. Any details that are only recorded against
      the patient record to be merged will also be retained.
    </p>
    <p>
      Clinical information such as encounters, allergies, existing conditions and family history
      will be retained from both patient records. 
    </p>
    <p>
      Program registry information including registration details, program statuses and related
      conditions will be retained for both patients. If a duplicate registration exists, only the
      registration and all associated data will only be retained for the kept patient. Program
      form responses will be retained for both patients.
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
      data-testid="confirmcancelrow-3i0t"
    />
  );
  return (
    <Modal
      title="Merge patients"
      actions={actions}
      open
      onClose={onCancel}
      data-testid="modal-wmvi"
    >
      <SelectInstructions data-testid="selectinstructions-8d76" />
      <PatientSummary
        patient={firstPatient}
        onSelect={() => setSelectedPatient(firstPatient)}
        selected={selectedPatient === firstPatient}
        data-testid="patientsummary-jcx5"
      />
      <PatientSummary
        patient={secondPatient}
        onSelect={() => setSelectedPatient(secondPatient)}
        selected={selectedPatient === secondPatient}
        data-testid="patientsummary-mywe"
      />
    </Modal>
  );
};
