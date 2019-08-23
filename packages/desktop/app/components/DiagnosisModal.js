import React from 'react';

import { diagnosisCertainty } from '../constants';
import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { viewVisit } from '../store/visit';

import { ConfirmCancelRow } from './ButtonRow';
import { Modal } from './Modal';
import { FormGrid } from './FormGrid';
import { Form, Field, SelectField, CheckField, AutocompleteField, DateField } from './Field';

const DiagnosisForm = React.memo(({ onCancel, onSave, diagnosis, icd10Suggester }) => (
  <Form
    onSubmit={onSave}
    initialValues={{
      date: new Date(),
      isPrimary: true,
      certainty: 'confirmed',
      ...diagnosis,
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
        <Field
          name="certainty"
          label="Certainty"
          component={SelectField}
          options={diagnosisCertainty}
          required
        />
        <Field name="date" label="Date" component={DateField} required />
        <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} />
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

export const DiagnosisModal = connectApi((api, dispatch, { visitId, onClose }) => ({
  onSaveDiagnosis: async data => {
    if (data._id) {
      await api.put(`patientDiagnosis/${data._id}`, data);
    } else {
      await api.post(`visit/${visitId}/diagnosis`, data);
    }

    onClose();
    dispatch(viewVisit(visitId));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
}))(DumbDiagnosisModal);
