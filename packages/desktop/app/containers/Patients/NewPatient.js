import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import { Grid } from '@material-ui/core';
import PropTypes from 'prop-types';
import actions from '../../actions/patients';
import {
  SelectField, DateField, RadioField, Container,
  BackButton, AddButton, TopBar, FormRow, Form, Field, TextField,
} from '../../components';
import {
  bloodOptions, sexOptions, getDifferenceDate, MUI_SPACING_UNIT as spacing,
} from '../../constants';
import { PatientModel } from '../../models';

const getAge = value => `${getDifferenceDate(moment(), value)} of age`;

function NewPatient({ createPatient, patientInProgress }) {
  const patientModel = new PatientModel();

  const submitForm = values => {
    patientModel.set(values);
    createPatient(patientModel);
  };

  return (
    <React.Fragment>
      <TopBar title="New Patient" />
      <Container style={{ paddingTop: spacing * 2 }}>
        <Form
          onSubmit={submitForm}
          validationSchema={patientModel.validationSchema}
          render={({ isValid }) => (
            <Grid container spacing={spacing * 3} direction="row">
              <FormRow>
                <Field
                  component={TextField}
                  name="firstName"
                  label="First Name"
                  required
                />
                <Field
                  component={TextField}
                  name="status"
                  label="Patient Status"
                />
              </FormRow>
              <FormRow>
                <Field
                  component={TextField}
                  name="middleName"
                  label="Middle Name"
                />
                <Field
                  component={TextField}
                  name="externalPatientId"
                  label="External Patient Id"
                />
              </FormRow>
              <FormRow>
                <Field
                  component={TextField}
                  name="lastName"
                  label="Last Name"
                  required
                />
                <Field
                  component={SelectField}
                  label="Blood Type"
                  options={bloodOptions}
                  name="bloodType"
                />
              </FormRow>
              <FormRow>
                <Field
                  component={TextField}
                  name="culturalName"
                  label="Cultural or Traditional Name"
                />
                <Field
                  component={TextField}
                  name="clinic"
                  label="Clinic Site"
                />
              </FormRow>
              <FormRow>
                <Field
                  component={SelectField}
                  label="Sex"
                  options={sexOptions}
                  name="sex"
                />
                <Field
                  component={TextField}
                  name="referredBy"
                  label="Referred By"
                />
              </FormRow>
              <FormRow>
                <Field
                  label="Date Of Birth"
                  name="dateOfBirth"
                  render={({ field: { value, ...field } }) => (
                    <DateField
                      helperText={value && getAge(value)}
                      field={{ value, ...field }}
                    />
                  )}
                />
                <Field
                  component={DateField}
                  label="Referred Date"
                  name="referredDate"
                />
              </FormRow>
              <FormRow>
                <Field
                  component={TextField}
                  name="religion"
                  label="Religion"
                />
                <Field
                  component={TextField}
                  name="placeOfBirth"
                  label="Place of Birth"
                />
              </FormRow>
              <FormRow>
                <Field
                  component={TextField}
                  name="parent"
                  label="Parent/Guardian"
                />
                <Field
                  component={TextField}
                  name="occupation"
                  label="Occupation"
                />
              </FormRow>
              <FormRow>
                <Field
                  component={TextField}
                  name="paymentProfile"
                  label="Payment Profile"
                />
                <Field
                  component={RadioField}
                  name="patientType"
                  label="Patient Type"
                  options={[{ value: 'charity', label: 'Charity' }, { value: 'private', label: 'Private' }]}
                  style={{ flexDirection: 'row' }}
                />
              </FormRow>
              <FormRow>
                <Field
                  component={TextField}
                  name="phone"
                  label="Phone"
                />
                <Field
                  component={TextField}
                  name="address"
                  label="Address"
                />
              </FormRow>
              <FormRow>
                <Field
                  component={TextField}
                  name="email"
                  label="Email"
                />
                <Field
                  component={TextField}
                  name="country"
                  label="Country"
                />
              </FormRow>
              <Grid
                container
                item
                justify="flex-end"
                style={{ paddingTop: spacing * 2 }}
              >
                <Grid item>
                  <BackButton to="/patients" />
                  <AddButton
                    type="submit"
                    disabled={!isValid || patientInProgress}
                    can={{ do: 'create', on: 'patient' }}
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
        />
      </Container>
    </React.Fragment>
  );
}

NewPatient.propTypes = {
  createPatient: PropTypes.func.isRequired,
  patientInProgress: PropTypes.bool,
};

NewPatient.defaultProps = {
  patientInProgress: false,
};

function mapStateToProps(state) {
  const { createPatientSuccess, patientInProgress } = state.patients;
  return {
    createPatientSuccess,
    patientInProgress,
  };
}

const { patient: patientActions } = actions;
const { savePatient } = patientActions;
const mapDispatchToProps = (dispatch) => ({
  createPatient: patient => dispatch(savePatient({ Model: patient })),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewPatient);
