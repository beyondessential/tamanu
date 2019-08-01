import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import Contacts from '../components/Contacts';
import { PatientModel } from '../../../models';
import {
  TextField,
  DateField,
  RadioField,
  UpdateButton,
  BackButton,
  FormRow,
  SelectField,
  Form,
  Field,
} from '../../../components';
import {
  bloodOptions,
  sexOptions,
  getDifferenceDate,
  MUI_SPACING_UNIT as spacing,
} from '../../../constants';

export default function General({ patientModel, savePatient }) {
  const submitForm = values => {
    patientModel.set(values);
    savePatient({ Model: patientModel });
  };

  return (
    <React.Fragment>
      <Form
        onSubmit={submitForm}
        initialValues={patientModel.toJSON()}
        validationSchema={patientModel.validationSchema}
        render={({ isSubmitting, values }) => (
          <Grid container spacing={24} direction="row">
            <FormRow>
              <Field component={TextField} name="firstName" label="First Name" required />
              <Field component={TextField} name="status" label="Patient Status" />
            </FormRow>
            <FormRow>
              <Field component={TextField} name="middleName" label="Middle Name" />
              <Field component={TextField} name="externalPatientId" label="External Patient Id" />
            </FormRow>
            <FormRow>
              <Field component={TextField} name="lastName" label="Last Name" required />
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
              <Field component={TextField} name="clinic" label="Clinic Site" />
            </FormRow>
            <FormRow>
              <Field component={SelectField} label="Sex" options={sexOptions} name="sex" />
              <Field component={TextField} name="referredBy" label="Referred By" />
            </FormRow>
            <FormRow>
              <Field
                component={DateField}
                label="Date Of Birth"
                name="dateOfBirth"
                helperText={
                  values.dateOfBirth && `${getDifferenceDate(moment(), values.dateOfBirth)} of age`
                }
              />
              <Field component={DateField} label="Referred Date" name="referredDate" />
            </FormRow>
            <FormRow>
              <Field component={TextField} name="religion" label="Religion" />
              <Field component={TextField} name="placeOfBirth" label="Place of Birth" />
            </FormRow>
            <FormRow>
              <Field component={TextField} name="parent" label="Parent/Guardian" />
              <Field component={TextField} name="occupation" label="Occupation" />
            </FormRow>
            <FormRow>
              <Field component={TextField} name="paymentProfile" label="Payment Profile" />
              <Field
                component={RadioField}
                name="patientType"
                label="Patient Type"
                options={[
                  { value: 'charity', label: 'Charity' },
                  { value: 'private', label: 'Private' },
                ]}
                inline
              />
            </FormRow>
            <FormRow>
              <Field component={TextField} name="phone" label="Phone" />
              <Field component={TextField} name="address" label="Address" />
            </FormRow>
            <FormRow>
              <Field component={TextField} name="email" label="Email" />
              <Field component={TextField} name="country" label="Country" />
            </FormRow>
            <Contacts
              patientModel={patientModel}
              style={{ marginTop: spacing * 2, marginBottom: spacing * 2 }}
            />
            <Grid container item justify="flex-end">
              <Grid item>
                <BackButton to="/patients" />
                <UpdateButton
                  type="submit"
                  disabled={isSubmitting}
                  can={{ do: 'update', on: 'patient' }}
                />
              </Grid>
            </Grid>
          </Grid>
        )}
      />
    </React.Fragment>
  );
}

General.propTypes = {
  savePatient: PropTypes.func.isRequired,
  patientModel: PropTypes.instanceOf(PatientModel).isRequired,
};
