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
      Patient details (name, sex, contact details, blood type etc.) from the kept record will be retained. Any additional details that exist only on the duplicate record will also be added to the merged record.
    </p>
    <p>
      All clinical data from both patient records will be retained. Clinical data includes encounters and encounter data, ongoing conditions, allergies, family history, and vaccination records.
    </p>
    <p>
      All program registry data from both patient records will be retained. This includes registration details, program statuses, related conditions, and program form responses. If both patients have registrations for the same program, only the kept patient&apos;s program registration and associated data will be retained. However, program form responses from both patients will always be retained.
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
