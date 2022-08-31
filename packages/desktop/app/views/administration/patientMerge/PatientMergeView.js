import React, { useState, useCallback } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import { KeepPatientDecisionForm } from './KeepPatientDecisionForm';
import { PatientMergeSearch } from './PatientMergeSearch';

export const PatientMergeView = ({ 
  fetchPatient,
  onMergePatients,
}) => {
  const [patients, setPatients] = useState(null);
  const [mergePlan, setMergePlan] = useState(null);
  const clear = useCallback(() => {
    setPatients(null);
    setMergePlan(null);
  })

  let modal = null;
  if (mergePlan) {
    modal = (
      <ConfirmationModal
        mergePlan={mergePlan}
        onBack={() => setMergePlan(null)}
        onCancel={clear}
        onConfirm={() => onMergePatients(mergePlan)}
      />
    );
  } else if (patients) {
    modal = (
      <KeepPatientDecisionForm
        firstPatient={patients[0]}
        secondPatient={patients[1]}
        onCancel={clear}
        onSelectPlan={(plan) => setMergePlan(plan)}
      />
    );
  }

  return (
    <React.Fragment>
      <PatientMergeSearch
        fetchPatient={fetchPatient}
        onBeginMerge={(a, b) => setPatients([a, b])}
      />
      {modal}
    </React.Fragment>
  );
};