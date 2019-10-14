import React, { memo, useState, useCallback } from 'react';
import { Collapse } from '@material-ui/core';
import * as yup from 'yup';

import { Form, Field, CheckField, CheckInput, NumberField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalActionRow } from '../components/ButtonRow';

const DEFAULT_PATIENT_COUNT = 100;

export const SeedRecordsForm = memo(({ onSubmit, onCancel }) => {
  const [patientCount, setPatientCount] = useState(0);
  const handleIncludePatients = useCallback(
    (e, includePatients) => setPatientCount(includePatients ? DEFAULT_PATIENT_COUNT : 0),
    [],
  );
  const handleChangePatientCount = useCallback(e => {
    const newPatientCount = parseInt(e.target.value, 10);
    setPatientCount(Number.isNaN(newPatientCount) ? 0 : newPatientCount);
  }, []);
  const renderForm = ({ submitForm }) => {
    return (
      <FormGrid columns={1}>
        <Field name="locations" label="Locations" component={CheckField} />
        <CheckInput label="Patients" onChange={handleIncludePatients} value={!!patientCount} />
        <Collapse in={!!patientCount}>
          <Field
            name="patientCount"
            label="Number of patients"
            component={NumberField}
            value={patientCount}
            onChange={handleChangePatientCount}
          />
        </Collapse>
        <ModalActionRow
          confirmText="Seed"
          cancelText="Clear"
          onConfirm={submitForm}
          onCancel={onCancel}
        />
      </FormGrid>
    );
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      validationSchema={yup.object().shape({
        locations: yup.boolean(),
        patientCount: yup.number(),
      })}
    />
  );
});
