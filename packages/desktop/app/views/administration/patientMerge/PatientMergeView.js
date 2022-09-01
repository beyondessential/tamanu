import React, { useState, useCallback } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import { KeepPatientDecisionForm } from './KeepPatientDecisionForm';
import { PatientMergeSearch } from './PatientMergeSearch';
import { MergeResultModal } from './MergeResultModal';
import { useApi } from '../../../api';

export const PatientMergeView = ({ fetchPatient }) => {
  const [regenKey, setRegenKey] = useState(Math.random());
  const [patients, setPatients] = useState(null);
  const [mergePlan, setMergePlan] = useState(null);
  const [result, setResult] = useState(null);

  const clear = useCallback(() => {
    setPatients(null);
    setMergePlan(null);
  });

  const api = useApi();
  const onMergePatients = async () => {
    const result = await api.post('admin/mergePatient', {
      keepPatientId: mergePlan.keepPatient.id,
      unwantedPatientId: mergePlan.removePatient.id,
    });
    setResult(result);
  };

  const reset = () => {
    setPatients(null);
    setMergePlan(null);
    setRegenKey(Math.random());
    setResult(null);
  };

  let modal = null;
  if (result) {
    modal = <MergeResultModal result={result} onClose={reset} />;
  } else if (mergePlan) {
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
        onSelectPlan={plan => setMergePlan(plan)}
      />
    );
  }

  return (
    <>
      <PatientMergeSearch
        key={regenKey}
        fetchPatient={fetchPatient}
        onBeginMerge={(a, b) => setPatients([a, b])}
      />
      {modal}
    </>
  );
};
