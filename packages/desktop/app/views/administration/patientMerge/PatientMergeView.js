import React, { useState, useCallback } from 'react';
import { Button } from '../../../components';
import { ConfirmationModal } from './ConfirmationModal';
import { KeepPatientDecisionForm } from './KeepPatientDecisionForm';

export const PatientMergeSearch = ({
  fetchPatient,
  onBeginMerge,
}) => {
  const [firstPatient, setFirstPatient] = useState();
  const [secondPatient, setSecondPatient] = useState();
  return (
    <div>
      <div onClick={() => setFirstPatient(firstPatient ? null : fetchPatient('patient1'))}>
        {firstPatient ? firstPatient.displayId : 'select 1'}
      </div>
      <div onClick={() => setSecondPatient(secondPatient ? null : fetchPatient('patient2'))}>
        {secondPatient ? secondPatient.displayId : 'select 2'}
      </div>
      <Button 
        disabled={!(firstPatient && secondPatient)}
        onClick={() => onBeginMerge(firstPatient, secondPatient)}
      >Select these two</Button>
    </div>
  );
};

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