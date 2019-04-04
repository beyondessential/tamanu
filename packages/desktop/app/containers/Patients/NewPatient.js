import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import { Grid } from '@material-ui/core';
import actions from '../../actions/patients';
import {
  TextInput, SelectInput, DateInput, RadioInput, Container,
  BackButton, AddButton, TopBar, FormRow,
} from '../../components';
import {
  bloodOptions, sexOptions, getDifferenceDate, MUI_SPACING_UNIT as spacing,
} from '../../constants';
import { PatientModel } from '../../models';

class NewPatient extends Component {
  state = {
    formIsValid: false,
    age: '0 months 0 days',
    patientType: 'charity',
  }

  componentDidMount() {
    const { patientModel } = this.props;
    patientModel.on('change', this.handleChange);
  }

  handleUserInput = (event) => {
    const { patientModel } = this.props;
    const { name, value } = event.target;
    patientModel.set(name, value);
  }

  onChangeDOB = (event) => {
    const { patientModel } = this.props;
    const { name, value } = event.target;
    this.setState({ age: getDifferenceDate(moment(), value) });
    patientModel.set(name, value);
  }

  handleChange = () => {
    const { patientModel } = this.props;
    const formIsValid = patientModel.isValid();
    const changedAttributes = patientModel.changedAttributes();
    this.setState({ ...changedAttributes, formIsValid });
  }

  submitForm = (event) => {
    event.preventDefault();
    const { patientModel } = this.props;
    this.props.createPatient(patientModel);
  }

  render() {
    const {
      age, patientInProgress, formIsValid, ...form
    } = this.state;
    return (
      <React.Fragment>
        <TopBar
          title="New Patient"
          buttons={(
            <React.Fragment>
              <BackButton to="/patients" />
              <AddButton
                type="submit"
                disabled={patientInProgress}
              />
            </React.Fragment>
          )}
        />
        <form
          onSubmit={this.submitForm}
        >
          <Container style={{ paddingTop: spacing * 2 }}>
            <Grid container spacing={spacing * 3} direction="row">
              <FormRow>
                <TextInput
                  name="firstName"
                  label="First Name"
                  onChange={this.handleUserInput}
                  value={form.firstName}
                  required
                />
                <TextInput
                  name="status"
                  label="Patient Status"
                  onChange={this.handleUserInput}
                  value={form.status}
                />
              </FormRow>
              <FormRow>
                <TextInput
                  name="middleName"
                  label="Middle Name"
                  onChange={this.handleUserInput}
                  value={form.middleName}
                />
                <TextInput
                  name="externalPatientId"
                  label="External Patient Id"
                  onChange={this.handleUserInput}
                  value={form.externalPatientId}
                />
              </FormRow>
              <FormRow>
                <TextInput
                  name="lastName"
                  label="Last Name"
                  onChange={this.handleUserInput}
                  value={form.lastName}
                  required
                />
                <SelectInput
                  label="Blood Type"
                  options={bloodOptions}
                  name="bloodType"
                  onChange={this.handleUserInput}
                  value={form.bloodType}
                />
              </FormRow>
              <FormRow>
                <TextInput
                  name="culturalName"
                  label="Cultural or Traditional Name"
                  onChange={this.handleUserInput}
                  value={form.culturalName}
                />
                <TextInput
                  name="clinic"
                  label="Clinic Site"
                  onChange={this.handleUserInput}
                  value={form.clinic}
                />
              </FormRow>
              <FormRow>
                <SelectInput
                  label="Sex"
                  options={sexOptions}
                  name="sex"
                  onChange={this.handleUserInput}
                  value={form.sex}
                />
                <TextInput
                  name="referredBy"
                  label="Referred By"
                  onChange={this.handleUserInput}
                  value={form.referredBy}
                />
              </FormRow>
              <FormRow>
                <DateInput
                  label="Date Of Birth"
                  name="dateOfBirth"
                  onChange={this.onChangeDOB}
                  value={form.dateOfBirth}
                  helperText={age && `${age} of age`}
                />
                <DateInput
                  label="Referred Date"
                  name="referredDate"
                  onChange={this.handleUserInput}
                  value={form.referredDate}
                />
              </FormRow>
              <FormRow>
                <TextInput
                  name="religion"
                  label="Religion"
                  onChange={this.handleUserInput}
                  value={form.religion}
                />
                <TextInput
                  name="placeOfBirth"
                  label="Place of Birth"
                  onChange={this.handleUserInput}
                  value={form.placeOfBirth}
                />
              </FormRow>
              <FormRow>
                <TextInput
                  name="parent"
                  label="Parent/Guardian"
                  onChange={this.handleUserInput}
                  value={form.parent}
                />
                <TextInput
                  name="occupation"
                  label="Occupation"
                  onChange={this.handleUserInput}
                  value={form.occupation}
                />
              </FormRow>
              <FormRow>
                <TextInput
                  name="paymentProfile"
                  label="Payment Profile"
                  onChange={this.handleUserInput}
                  value={form.paymentProfile}
                />
                <RadioInput
                  name="patientType"
                  label="Patient Type"
                  options={[{ value: 'charity', label: 'Charity' }, { value: 'private', label: 'Private' }]}
                  onChange={this.handleUserInput}
                  style={{ flexDirection: 'row' }}
                  value={form.patientType}
                />
              </FormRow>
              <FormRow>
                <TextInput
                  name="phone"
                  label="Phone"
                  onChange={this.handleUserInput}
                  value={form.phone}
                />
                <TextInput
                  name="address"
                  label="Address"
                  onChange={this.handleUserInput}
                  value={form.address}
                />
              </FormRow>
              <FormRow>
                <TextInput
                  name="email"
                  label="Email"
                  onChange={this.handleUserInput}
                  value={form.email}
                />
                <TextInput
                  name="country"
                  label="Country"
                  onChange={this.handleUserInput}
                  value={form.country}
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
                    disabled={!formIsValid}
                    can={{ do: 'create', on: 'patient' }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </form>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { createPatientSuccess, patientInProgress } = state.patients;
  return {
    createPatientSuccess,
    patientInProgress,
    patientModel: new PatientModel(),
  };
}

const { patient: patientActions } = actions;
const { savePatient } = patientActions;
const mapDispatchToProps = (dispatch) => ({
  createPatient: patient => dispatch(savePatient({ Model: patient })),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewPatient);
