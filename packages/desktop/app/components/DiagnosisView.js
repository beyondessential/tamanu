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
import { Form, Field, TextField, SelectField, CheckField, AutocompleteField, DateField } from './Field';


const DiagnosisItemContainer = styled.div`
  margin-right: 1rem;
  padding: 1rem;
  background: #ececfc;
  display: inline-block;
  border-radius: 0.1rem;
  cursor: pointer;
`;

const DiagnosisItem = React.memo(({ _id, diagnosis: { name, code }, isPrimary, onClick }) => (
  <DiagnosisItemContainer onClick={onClick}>
    <span>{isPrimary ? "Primary" : "Secondary"}</span>
    <span>: </span>
    <span><b>{name}</b></span>
  </DiagnosisItemContainer>
));

function compareDiagnosis(a, b) {
  if(a.isPrimary === b.isPrimary) {
    return a.diagnosis.name.localeCompare(b.diagnosis.name);
  } 
  
  if(a.isPrimary) return -1;
  if(b.isPrimary) return 1;
}

const DiagnosisListContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
`;

const DiagnosisList = connect(
  state => ({ 
    diagnoses: getDiagnoses(state)
      .filter(d => d.diagnosis)
      .sort(compareDiagnosis)
  })
)(React.memo(({ diagnoses, onEditDiagnosis }) => {
  if(diagnoses.length === 0) {
    return <DiagnosisListContainer>No diagnosis recorded.</DiagnosisListContainer>
  }

  return (
    <DiagnosisListContainer>
      { 
      diagnoses
        .map(d => <DiagnosisItem key={d._id} {...d} onClick={() => onEditDiagnosis(d)} />)
      }
    </DiagnosisListContainer>
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
    initialValues={{
      date: new Date(),
      isPrimary: true,
      certainty: 'confirmed',
      ...diagnosis
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
    if(data._id) {
      await api.put(`patientDiagnosis/${data._id}`, data); 
    } else {
      await api.post(`visit/${visitId}/diagnosis`, data);
    }

    onClose();
    dispatch(viewVisit(visitId));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
}))(DumbDiagnosisModal);

const DiagnosisGrid = styled.div`
  display: grid;
  grid-template-columns: max-content auto max-content;
`;

export const DiagnosisView = React.memo(({ visitId }) => {
  const [diagnosis, editDiagnosis] = React.useState(null);

  return (
    <React.Fragment>
      <DiagnosisModal diagnosis={diagnosis} visitId={visitId} onClose={() => editDiagnosis(null)} />
      <DiagnosisGrid>
        <div>Diagnosis:</div>
        <DiagnosisList onEditDiagnosis={d => editDiagnosis(d)} />
        <Button onClick={() => editDiagnosis({})}>Add diagnosis</Button>
      </DiagnosisGrid>
    </React.Fragment>
  );
});
