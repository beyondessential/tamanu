import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import styled from 'styled-components';

import { AVPU_OPTIONS } from 'shared/constants';
import {
  Form,
  Field,
  DateTimeField,
  NumberField,
  SelectField,
  TemperatureField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

const BloodPressureFieldsContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 0.5rem;
`;

// When a vitals field defaults to 0 people get confused and try to delete it
// Default to null instead
const VitalsNumericField = ({ ...props }) => <NumberField {...props} />;

VitalsNumericField.defaultProps = {
  value: null,
};

const numericType = yup
  .number()
  .nullable(true)
  .transform((value, originalValue) => {
    if (!value) {
      return null;
    }
    return originalValue;
  });

const schema = yup.object().shape({
  dateRecorded: yup.date().required(),
  height: numericType,
  weight: numericType,
  sbp: numericType,
  dbp: numericType,
  heartRate: numericType,
  respiratoryRate: numericType,
  temperature: numericType,
  spo2: numericType,
  avpu: yup.string(),
});

export class VitalsForm extends React.PureComponent {
  renderForm = ({ submitForm }) => {
    const { onCancel } = this.props;
    return (
      <FormGrid columns={2}>
        <div style={{ gridColumn: 'span 2' }}>
          <Field
            name="dateRecorded"
            label="Date recorded"
            component={DateTimeField}
            saveDateAsString
          />
        </div>
        <Field name="height" label="Height (cm)" component={VitalsNumericField} />
        <Field name="weight" label="Weight (kg)" component={VitalsNumericField} />
        <BloodPressureFieldsContainer>
          <Field name="sbp" label="SBP" component={VitalsNumericField} />
          <Field name="dbp" label="DBP" component={VitalsNumericField} />
        </BloodPressureFieldsContainer>
        <Field name="heartRate" label="Heart rate" component={VitalsNumericField} />
        <Field name="respiratoryRate" label="Respiratory rate" component={VitalsNumericField} />
        <Field name="temperature" component={TemperatureField} />
        <Field name="spo2" label="SpO2 (%)" component={VitalsNumericField} />
        <Field name="avpu" label="AVPU" component={SelectField} options={AVPU_OPTIONS} />
        <ConfirmCancelRow confirmText="Record" onConfirm={submitForm} onCancel={onCancel} />
      </FormGrid>
    );
  };

  render() {
    const { onSubmit, editedObject } = this.props;
    return (
      <Form
        onSubmit={values => {
          const castedValues = schema.cast(values);
          onSubmit(castedValues);
        }}
        render={this.renderForm}
        initialValues={{
          dateRecorded: getCurrentDateTimeString(),
          ...editedObject,
        }}
        validationSchema={schema}
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
