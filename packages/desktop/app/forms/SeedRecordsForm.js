import React, { memo, useCallback } from 'react';
import { Collapse } from '@material-ui/core';

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
        <Field name="allergies" label="Allergies" component={CheckField} />
        <Field name="departments" label="Departments" component={CheckField} />
        <Field name="diagnoses" label="Diagnoses" component={CheckField} />
        <Field name="drugs" label="Drugs" component={CheckField} />
        <Field name="procedureTypes" label="Procedure types" component={CheckField} />
        <Field name="facilities" label="Facilities" component={CheckField} />
        <Field name="imagingTypes" label="Imaging types" component={CheckField} />
        <Field name="labTestTypes" label="Lab test types" component={CheckField} />
        <Field name="locations" label="Locations" component={CheckField} />
        <Field name="villages" label="Villages" component={CheckField} />
        <Field name="users" label="Users" component={CheckField} />
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
      initialValues={{
        allergies: true,
        departments: true,
        diagnoses: true,
        drugs: true,
        procedureTypes: true,
        facilities: true,
        imagingTypes: true,
        labTestTypes: true,
        locations: true,
        users: true,
        villages: true,
        patientCount: DEFAULT_PATIENT_COUNT,
      }}
    />
  );
});
