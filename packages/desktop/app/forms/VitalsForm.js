import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import styled from 'styled-components';

import { AVPU_OPTIONS } from 'shared/constants';
import { Form, Field, DateTimeField, NumberField, SelectField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

const BloodPressureFieldsContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 0.5rem;
`;

export class VitalsForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { onCancel } = this.props;
    return (
      <FormGrid columns={2}>
        <div style={{ gridColumn: 'span 2' }}>
          <Field name="dateRecorded" label="Date recorded" component={DateTimeField} />
        </div>
        <Field name="height" label="Height (cm)" component={NumberField} />
        <Field name="weight" label="Weight (kg)" component={NumberField} />
        <BloodPressureFieldsContainer>
          <Field name="sbp" label="SBP" component={NumberField} />
          <Field name="dbp" label="DBP" component={NumberField} />
        </BloodPressureFieldsContainer>
        <Field name="heartRate" label="Heart rate" component={NumberField} />
        <Field name="respiratoryRate" label="Respiratory rate" component={NumberField} />
        <Field name="temperature" label="Temperature (ºC)" component={NumberField} />
        <Field name="spo2" label="SpO2 (%)" component={NumberField} />
        <Field name="avpu" label="AVPU" component={SelectField} options={AVPU_OPTIONS} />
        <ConfirmCancelRow confirmText="Record" onConfirm={submitForm} onCancel={onCancel} />
      </FormGrid>
    );
  };

  render() {
    const { onSubmit, editedObject } = this.props;
    return (
      <Form
        onSubmit={onSubmit}
        render={this.renderForm}
        initialValues={{
          dateRecorded: new Date(),
          ...editedObject,
        }}
        validationSchema={yup.object().shape({
          dateRecorded: yup.date().required(),
          height: yup.number(),
          weight: yup.number(),
          sbp: yup.number(),
          dbp: yup.number(),
          heartRate: yup.number(),
          respiratoryRate: yup.number(),
          temperature: yup.number(),
          spo2: yup.number(),
          avpu: yup.string(),
        })}
        validate={values => {
          const errors = {};

          // All readings are either numbers or strings
          if (!Object.values(values).some(x => x && ['number', 'string'].includes(typeof x))) {
            errors.form = 'At least one recording must be entered.';
          }

          return errors;
        }}
      />
    );
  }
}

VitalsForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
