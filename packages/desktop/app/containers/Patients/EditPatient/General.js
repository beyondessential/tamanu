import React, { Component } from 'react';
import Select from 'react-select';
import moment from 'moment';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import Contacts from '../components/Contacts';
import { InputGroup, DatepickerGroup, RadioGroup, UpdateButton, BackButton } from '../../../components';
import { bloodOptions, sexOptions, getDifferenceDate } from '../../../constants';

class General extends Component {
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

  handleChange(props = this.props) {
    const { model: patientModel } = props;
    let { age } = this.state;
    if (patientModel.get('dateOfBirth') !== null) patientModel.set('dateOfBirth', moment(patientModel.get('dateOfBirth')));
    if (patientModel.get('referredDate') !== null) patientModel.set('referredDate', moment(patientModel.get('referredDate')));
    if (patientModel.get('dateOfBirth') !== null) age = getDifferenceDate(moment(), patientModel.get('dateOfBirth'));
    this.setState({ age, patientModel });
  }

  handleUserInput = (e, field) => {
    const { model: patientModel } = this.props;
    let { age } = this.state;
    if (typeof field !== 'undefined') {
      patientModel.set(field, e, { silent: true });
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      patientModel.set(name, value, { silent: true });
    }

    // Get age
    if (field === 'dateOfBirth') age = getDifferenceDate(moment(), e);
    this.setState({ age, patientModel });
  }

  submitForm = (e) => {
    e.preventDefault();
    const { patientModel } = this.state;
    this.props.savePatient({ Model: patientModel });
  }

  // updatePatient = async (patient) => {
  //   const { history, model: patientModel } = this.props;
  //   const updatedPatient = patient;
  //   updatedPatient.birthday = moment(this.props.updatedBirthday).format('YYYY-MM-DD');
  //   updatedPatient.referredDate = moment(this.props.updatedReferredDate).format('YYYY-MM-DD');
  //   console.log({ updatedPatient });
  //   patientModel.set(updatedPatient);
  //   if (patientModel.isValid()) {
  //     await patientModel.save();
  //     history.push('/patients');
  //   }
  // }

  render() {
    const {
      patientModel,
      age,
    } = this.state;
    const { attributes: form } = patientModel;
    return (
      <div>
        <form
          id="generalForm"
          onSubmit={this.submitForm}
        />
        <div className="form no-margin">
          <div className="columns">
            <div className="column">
              <InputGroup
                name="firstName"
                label="First Name"
                value={form.firstName}
                onChange={this.handleUserInput}
                required
                tabIndex={1}
              />
            </div>
            <div className="column">
              <InputGroup
                name="status"
                label="Patient Status"
                value={form.status}
                onChange={this.handleUserInput}
                tabIndex={7}
              />
            </div>
          </div>
          <div className="columns">
            <div className="column">
              <InputGroup
                name="middleName"
                label="Middle Name"
                value={form.middleName}
                onChange={this.handleUserInput}
                tabIndex={2}
              />
            </div>
            <div className="column">
              <InputGroup
                name="externalPatientId"
                label="External Patient Id"
                value={form.externalPatientId}
                onChange={this.handleUserInput}
                tabIndex={8}
              />
            </div>
          </div>
          <div className="columns">
            <div className="column">
              <InputGroup
                name="lastName"
                label="Last Name"
                value={form.lastName}
                onChange={this.handleUserInput}
                required
                tabIndex={3}
              />
            </div>
            <div className="column">
              <div className="column">
                <span className="header">
                  Blood Type
                </span>
                <Select
                  options={bloodOptions}
                  simpleValue
                  name="bloodType"
                  value={form.bloodType}
                  onChange={val => this.handleUserInput(val, 'bloodType')}
                />
              </div>
            </div>
          </div>
          <div className="columns">
            <div className="column">
              <InputGroup
                name="culturalName"
                label="Cultural or Traditional Name"
                value={form.culturalName}
                onChange={this.handleUserInput}
                tabIndex={4}
              />
            </div>
            <div className="column">
              <InputGroup
                name="clinic"
                label="Clinic Site"
                value={form.clinic}
                onChange={this.handleUserInput}
                tabIndex={9}
              />
            </div>
          </div>
          <div className="columns">
            <div className="column">
              <div className="column">
                <span className="header">
                  Sex
                </span>
                <Select
                  options={sexOptions}
                  simpleValue
                  name="sex"
                  value={form.sex}
                  onChange={val => this.handleUserInput(val, 'sex')}
                />
              </div>
            </div>
            <div className="column">
              <InputGroup
                name="referredBy"
                label="Referred By"
                value={form.referredBy}
                onChange={this.handleUserInput}
                tabIndex={10}
              />
            </div>
          </div>
          <div className="columns">
            <div className="column">
              <DatepickerGroup
                label="Date Of Birth"
                name="dateOfBirth"
                onChange={this.handleUserInput}
                value={form.dateOfBirth}
              />
            </div>
            <div className="column">
              <DatepickerGroup
                label="Referred Date"
                name="referredDate"
                onChange={this.handleUserInput}
                value={form.referredDate}
              />
            </div>
          </div>
          <div className="columns">
            <div className="column">
              <div className="column">
                <span className="header">
                  Age
                </span>
                <p name="age" value={age}>
                  {age}
                </p>
              </div>
            </div>
            <div className="column">
              <InputGroup
                name="religion"
                label="Religion"
                value={form.religion}
                onChange={this.handleUserInput}
                tabIndex={11}
              />
            </div>
          </div>
          <div className="columns">
            <div className="column">
              <InputGroup
                name="placeOfBirth"
                label="Place of Birth"
                value={form.placeOfBirth}
                onChange={this.handleUserInput}
                tabIndex={5}
              />
            </div>
            <div className="column">
              <InputGroup
                name="parent"
                label="Parent/Guardian"
                value={form.parent}
                onChange={this.handleUserInput}
                tabIndex={12}
              />
            </div>
          </div>
          <div className="columns">
            <div className="column">
              <InputGroup
                name="occupation"
                label="Occupation"
                value={form.occupation}
                onChange={this.handleUserInput}
                tabIndex={6}
              />
            </div>
            <div className="column">
              {/* Not sure about this type */}
              <InputGroup
                name="paymentProfile"
                label="Payment Profile"
                value={form.paymentProfile}
                onChange={this.handleUserInput}
                tabIndex={13}
              />
            </div>
          </div>
          <div className="columns">
            <div className="column is-6">
              <RadioGroup
                name="patientType"
                className="column"
                label="Patient Type"
                value={form.patientType}
                options={[{ value: 'charity', label: 'Charity' }, { value: 'private', label: 'Private' }]}
                onChange={this.handleUserInput}
                stacked
              />
            </div>
          </div>
          <div className="columns">
            <div className="column">
              <InputGroup
                name="phone"
                label="Phone"
                value={form.phone}
                onChange={this.handleUserInput}
                tabIndex={14}
              />
              <InputGroup
                name="address"
                label="Address"
                value={form.address}
                onChange={this.handleUserInput}
                tabIndex={15}
              />
            </div>
            <div className="column">
              <InputGroup
                name="email"
                label="Email"
                value={form.email}
                onChange={this.handleUserInput}
                tabIndex={16}
              />
              <InputGroup
                name="country"
                label="Country"
                value={form.country}
                onChange={this.handleUserInput}
                tabIndex={17}
              />
            </div>
          </div>
          <div className="formLayout">
            <Contacts
              model={patientModel}
            />
          </div>
        </div>
        <div className="column has-text-right">
          <BackButton to="/patients" />
          <UpdateButton
            form="generalForm"
            type="submit"
            disabled={!patientModel.isValid()}
            can={{ do: 'update', on: 'patient' }}
          />
        </div>

      </div>
    );
  }
}

General.propTypes = {
  savePatient: PropTypes.func.isRequired
}

export default General;
