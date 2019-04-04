import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import Contacts from '../components/Contacts';
import { PatientModel } from '../../../models';
import {
  TextInput, DateInput, RadioInput, UpdateButton, BackButton,
  FormRow, SelectInput,
} from '../../../components';
import {
  bloodOptions, sexOptions, getDifferenceDate, MUI_SPACING_UNIT as spacing,
} from '../../../constants';

export default class General extends Component {
  constructor(props) {
    super(props);
    this.submitForm = this.submitForm.bind(this);
  }

  state = {
    age: 'Please select age',
    patientModel: {},
  }

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange = (props = this.props) => {
    const { patientModel } = props;
    let { age } = this.state;
    if (patientModel.get('dateOfBirth') !== null) patientModel.set('dateOfBirth', moment(patientModel.get('dateOfBirth')));
    if (patientModel.get('referredDate') !== null) patientModel.set('referredDate', moment(patientModel.get('referredDate')));
    if (patientModel.get('dateOfBirth') !== null) age = getDifferenceDate(moment(), patientModel.get('dateOfBirth'));
    this.setState({ age, patientModel });
  }

  handleUserInput = (event) => {
    const { patientModel } = this.props;
    let { age } = this.state;
    const { name, value } = event.target;
    patientModel.set(name, value, { silent: true });

    // Get age
    if (name === 'dateOfBirth') age = getDifferenceDate(moment(), event);
    this.setState({ age, patientModel });
  }

  submitForm = (e) => {
    e.preventDefault();
    const { patientModel } = this.state;
    this.props.savePatient({ Model: patientModel });
  }

  render() {
    const {
      patientModel,
      age,
    } = this.state;
    const { attributes: form } = patientModel;

    return (
      <Grid container spacing={24} direction="row">
        <form id="generalForm" onSubmit={this.submitForm} />
        <FormRow>
          <TextInput
            name="firstName"
            label="First Name"
            value={form.firstName}
            onChange={this.handleUserInput}
            required
          />
          <TextInput
            name="status"
            label="Patient Status"
            value={form.status}
            onChange={this.handleUserInput}
          />
        </FormRow>
        <FormRow>
          <TextInput
            name="middleName"
            label="Middle Name"
            value={form.middleName}
            onChange={this.handleUserInput}
          />
          <TextInput
            name="externalPatientId"
            label="External Patient Id"
            value={form.externalPatientId}
            onChange={this.handleUserInput}
          />
        </FormRow>
        <FormRow>
          <TextInput
            name="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={this.handleUserInput}
            required
          />
          <SelectInput
            label="Blood Type"
            options={bloodOptions}
            name="bloodType"
            value={form.bloodType}
            onChange={this.handleUserInput}
          />
        </FormRow>
        <FormRow>
          <TextInput
            name="culturalName"
            label="Cultural or Traditional Name"
            value={form.culturalName}
            onChange={this.handleUserInput}
          />
          <TextInput
            name="clinic"
            label="Clinic Site"
            value={form.clinic}
            onChange={this.handleUserInput}
          />
        </FormRow>
        <FormRow>
          <SelectInput
            label="Sex"
            options={sexOptions}
            name="sex"
            value={form.sex}
            onChange={this.handleUserInput}
          />
          <TextInput
            name="referredBy"
            label="Referred By"
            value={form.referredBy}
            onChange={this.handleUserInput}
          />
        </FormRow>
        <FormRow>
          <DateInput
            label="Date Of Birth"
            name="dateOfBirth"
            onChange={this.handleUserInput}
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
            value={form.religion}
            onChange={this.handleUserInput}
          />
          <TextInput
            name="placeOfBirth"
            label="Place of Birth"
            value={form.placeOfBirth}
            onChange={this.handleUserInput}
          />
        </FormRow>
        <FormRow>
          <TextInput
            name="parent"
            label="Parent/Guardian"
            value={form.parent}
            onChange={this.handleUserInput}
          />
          <TextInput
            name="occupation"
            label="Occupation"
            value={form.occupation}
            onChange={this.handleUserInput}
          />
        </FormRow>
        <FormRow>
          <TextInput
            name="paymentProfile"
            label="Payment Profile"
            value={form.paymentProfile}
            onChange={this.handleUserInput}
          />
          <RadioInput
            name="patientType"
            label="Patient Type"
            value={form.patientType}
            options={[{ value: 'charity', label: 'Charity' }, { value: 'private', label: 'Private' }]}
            onChange={this.handleUserInput}
            style={{ flexDirection: 'row' }}
          />
        </FormRow>
        <FormRow>
          <TextInput
            name="phone"
            label="Phone"
            value={form.phone}
            onChange={this.handleUserInput}
          />
          <TextInput
            name="address"
            label="Address"
            value={form.address}
            onChange={this.handleUserInput}
          />
        </FormRow>
        <FormRow>
          <TextInput
            name="email"
            label="Email"
            value={form.email}
            onChange={this.handleUserInput}
          />
          <TextInput
            name="country"
            label="Country"
            value={form.country}
            onChange={this.handleUserInput}
          />
        </FormRow>
        <Contacts
          patientModel={patientModel}
          style={{ marginTop: spacing * 2, marginBottom: spacing * 2 }}
        />
        <Grid container item justify="flex-end">
          <Grid item>
            <BackButton to="/patients" />
            <UpdateButton
              form="generalForm"
              type="submit"
              disabled={!patientModel.isValid()}
              can={{ do: 'update', on: 'patient' }}
            />
          </Grid>
        </Grid>
      </Grid>
    );
  }
}

General.propTypes = {
  savePatient: PropTypes.func.isRequired,
  patientModel: PropTypes.instanceOf(PatientModel).isRequired,
};
