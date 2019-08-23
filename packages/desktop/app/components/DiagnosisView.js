import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { diagnosisCertainty } from '../constants';
import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { getDiagnoses, viewVisit } from '../store/visit';

import { Button } from './Button';
import { ConfirmCancelRow } from './ButtonRow';
import { Modal } from './Modal';
import { FormGrid } from './FormGrid';
import { Form, Field, SelectField, CheckField, AutocompleteField, DateField } from './Field';


const DiagnosisItem = React.memo(({ _id, diagnosis: { name, code }, isPrimary }) => (
  <div>
    {`[${code}] ${name} ${isPrimary ? "" : "2ndary"}`}
  </div>
));

function compareDiagnosis(a, b) {
  if(a.isPrimary === b.isPrimary) {
    return a.diagnosis.name.localeCompare(b.diagnosis.name);
  } 
  
  if(a.isPrimary) return -1;
  if(b.isPrimary) return 1;
}

const DiagnosisList = connect(
  state => ({ 
    diagnoses: getDiagnoses(state),
  })
)(React.memo(({ diagnoses, onEditDiagnosis }) => {
  if(diagnoses.length === 0) {
    return <div>No diagnosis recorded.</div>
  }

  return (
    <div>
      <div>Diagnosis:</div>
      { 
      diagnoses
        .filter(d => d.diagnosis)
        .sort(compareDiagnosis)
        .map(d => <DiagnosisItem key={d._id} {...d} />)
      }
    </div>
  );
}));

const DiagnosisForm = React.memo(({ 
  onCancel, 
  onSave,
  diagnosis,
  icd10Suggester,
  visitId
}) => (
  <Form
    onSubmit={onSave}
    editedObject={diagnosis}
    initialValues={{
      date: new Date(),
      isPrimary: true,
      certainty: 'confirmed',
    }}
    render={({ submitForm }) => (
      <FormGrid>
        <div style={{ gridColumn: 'span 2' }}>
          <Field 
            name="diagnosis._id" 
            label="ICD10 Code" 
            component={AutocompleteField} 
            suggester={icd10Suggester}
            required
          />
        </div>
        <Field name="isPrimary" label="Is primary" component={CheckField} />
        <Field name="certainty" label="Certainty" component={SelectField} options={diagnosisCertainty} required />
        <Field name="date" label="Date" component={DateField} required />
        <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel}/>
      </FormGrid>
    )}
  />
));

const DumbDiagnosisModal = React.memo(({ diagnosis, onClose, onSaveDiagnosis, icd10Suggester }) => (
  <Modal title="Diag" open={!!diagnosis} onClose={onClose}>
    <DiagnosisForm 
      onSave={onSaveDiagnosis} 
      onCancel={onClose}
      diagnosis={diagnosis}
      icd10Suggester={icd10Suggester}
    />
  </Modal>
));

const DiagnosisModal = connectApi((api, dispatch, { visitId, onClose }) => ({
  onSaveDiagnosis: async data => {
    const createdDiagnosis = await api.post(`visit/${visitId}/diagnosis`, data);
    onClose();
    dispatch(viewVisit(visitId));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
}))(DumbDiagnosisModal);

export const DiagnosisView = React.memo(({ visitId }) => {
  const [diagnosis, editDiagnosis] = React.useState(null);

  // TODO: actually save diagnoses, reload diagnoses, be able to edit diagnoses, 
  // pass visitid thru to form
  return (
    <div>
      <DiagnosisModal diagnosis={diagnosis} visitId={visitId} onClose={() => editDiagnosis(null)} />
      <DiagnosisList onEditDiagnosis={d => editDiagnosis(d)} />
      <Button onClick={() => editDiagnosis({})}>Add diagnosis</Button>
    </div>
  );
});
