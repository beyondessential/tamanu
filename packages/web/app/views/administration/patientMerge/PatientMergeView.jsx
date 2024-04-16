import React, { useState } from 'react';
import { ConfirmationModal } from './ConfirmationModal';
import { KeepPatientDecisionForm } from './KeepPatientDecisionForm';
import { PatientMergeSearch } from './PatientMergeSearch';
import { MergeResultModal } from './MergeResultModal';
import { MergeErrorModal } from './MergeErrorModal';
import { useApi } from '../../../api';

export const PatientMergeView = ({ fetchPatient }) => {
  const [regenKey, setRegenKey] = useState(Math.random());
  const [patients, setPatients] = useState(null);
  const [mergePlan, setMergePlan] = useState(null);
  const [result, setResult] = useState(null);
  const [mergeError, setMergeError] = useState(null);

  const clear = () => {
    setPatients(null);
    setMergePlan(null);
  };

  const api = useApi();
  const onMergePatients = async () => {
    try {
      const mergeResult = await api.post('admin/mergePatient', {
        keepPatientId: mergePlan.keepPatient.id,
        unwantedPatientId: mergePlan.removePatient.id,
      });
      setResult(mergeResult);
    } catch (e) {
      setMergeError(e);
    }
  };

  const reset = () => {
    setPatients(null);
    setMergePlan(null);
    setRegenKey(Math.random());
    setMergeError(null);
    setResult(null);
  };

  let modal = null;
  if (mergeError) {
    modal = <MergeErrorModal error={mergeError} onClose={reset} />;
  } else if (result) {
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
        onSelectPlan={setMergePlan}
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
