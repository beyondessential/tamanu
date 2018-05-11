import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';

import ModalView from '../../components/Modal';
import InputGroup from '../../components/InputGroup';
import CustomDateInput from '../../components/CustomDateInput';
import Serializer from '../../utils/form-serialize';
import { createPatient } from '../../actions/patients';
import { bloodOptions, sexOptions } from '../../constants';

class NewPatient extends Component {
  state = {
    formError: false,
    bloodType: '',
    birthday: moment(),
    sex: ''
  }

  onCloseModal = () => {
    this.setState({ formError: false });
  }

  updateBloodValue = (newValue) => {
    this.setState({
      bloodType: newValue,
    });
  }

  updateSexValue = (newValue) => {
    this.setState({
      sex: newValue,
    });
  }

  onChangeDate = (date) => {
    this.setState({
      birthday: date,
    });
  }

  render() {
    const { formError, birthday } = this.state;
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            New Patient
          </span>
          <div className="view-action-buttons">
            <button>
              Admit Patient
            </button>
          </div>
        </div>
        <form
          className="create-container"
          onSubmit={(e) => {
            e.preventDefault();
            const patient = Serializer.serialize(e.target, { hash: true });
            if (patient.firstName && patient.lastName) {
              this.props.createPatient(patient);
            } else {
              this.setState({ formError: true });
            }
          }}
        >
          <div className="form">
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="firstName"
                  label="First Name"
                  required
                />
              </div>
              <div className="column">
                <InputGroup
                  name="patientStatus"
                  label="Patient Status"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="middleName"
                  label="Middle Name"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="externalPatientId"
                  label="External Patient Id"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="lastName"
                  label="Last Name"
                  required
                />
              </div>
              <div className="column">
                <div className="column">
                  <span className="header">
                    Blood Type
                  </span>
                  <Select
                    id="state-select"
                    ref={(ref) => { this.select = ref; }}
                    onBlurResetsInput={false}
                    onSelectResetsInput={false}
                    options={bloodOptions}
                    simpleValue
                    clearable
                    name="bloodType"
                    disabled={this.state.disabled}
                    value={this.state.bloodType}
                    onChange={this.updateBloodValue}
                    rtl={this.state.rtl}
                    searchable={this.state.searchable}
                  />
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="culturalName"
                  label="Cultural or Traditional Name"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="clinicSite"
                  label="Clinic Site"
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
                    id="state-select"
                    ref={(ref) => { this.select = ref; }}
                    onBlurResetsInput={false}
                    onSelectResetsInput={false}
                    options={sexOptions}
                    simpleValue
                    clearable
                    name="sex"
                    disabled={this.state.disabled}
                    value={this.state.sex}
                    onChange={this.updateSexValue}
                    rtl={this.state.rtl}
                    searchable={this.state.searchable}
                  />
                </div>
              </div>
              <div className="column">
                <InputGroup
                  name="referredBy"
                  label="Referred By"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column">
                  <span className="header">
                    Date Of Birth
                  </span>
                  <DatePicker
                    name="birthday"
                    autoFocus
                    customInput={<CustomDateInput />}
                    selected={birthday}
                    onChange={this.onChangeDate}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                    type="button"
                    dropdownMode="select"
                  />
                </div>
              </div>
              <div className="column">
                <InputGroup
                  name="referredDate"
                  label="Referred Date"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="age"
                  label="Age"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="religion"
                  label="Religion"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="placeOfBirth"
                  label="Place of Birth"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="parent"
                  label="Parent/Guardian"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="occupation"
                  label="Occupation"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="paymentProfile"
                  label="Payment Profile"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column is-6">
                <InputGroup
                  name="patientType"
                  label="Patient Type"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column has-text-right">
                  <a className="button is-primary">+ Add Contact</a>
                </div>
              </div>
            </div>
          </div>
          <div className="columns second-form">
            <div className="column">
              <InputGroup
                name="phone"
                label="Phone"
              />
              <InputGroup
                name="address"
                label="Address"
              />
            </div>
            <div className="column">
              <InputGroup
                name="email"
                label="Email"
              />
              <InputGroup
                name="country"
                label="Country"
              />
              <div className="column has-text-right">
                <Link className="button is-danger cancel" to="/patients">Cancel</Link>
                <button className="button" type="submit">Add</button>
              </div>
            </div>
          </div>
        </form>
        <ModalView
          isVisible={formError}
          onClose={this.onCloseModal}
          headerTitle="Warning!!!!"
          contentText="Please fill in required fields (marked with *) and correct the errors before saving."
          little
        />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  createPatient: patient => dispatch(createPatient(patient)),
});

export default connect(undefined, mapDispatchToProps)(NewPatient);
