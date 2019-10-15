import React, { memo, useCallback } from 'react';
import { Collapse } from '@material-ui/core';
import * as yup from 'yup';

import { Form, Field, CheckField, CheckInput, NumberField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

const DEFAULT_PATIENT_COUNT = 100;

export const SeedRecordsForm = memo(({ onSubmit }) => {
  const renderForm = useCallback(({ submitForm, values, setValues, resetForm }) => {
    const handleIncludePatients = () => {
      setValues({ ...values, patientCount: values.patientCount ? 0 : DEFAULT_PATIENT_COUNT });
    };
    return (
      <FormGrid columns={1}>
        <Field name="locations" label="Locations" component={CheckField} />
        <Field name="practitioners" label="Practitioners" component={CheckField} />
        <CheckInput
          label="Patients"
          onChange={handleIncludePatients}
          value={!!values.patientCount}
        />
        <Collapse in={!!values.patientCount}>
          <Field name="patientCount" label="Number of patients" component={NumberField} />
        </Collapse>
        <ConfirmCancelRow
          confirmText="Seed"
          cancelText="Clear"
          onConfirm={submitForm}
          onCancel={resetForm}
        />
      </FormGrid>
    );
  }, []);

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      validationSchema={yup.object().shape({
        locations: yup.boolean(),
        practitioners: yup.boolean(),
        patientCount: yup.number(),
      })}
    />
  );
});
