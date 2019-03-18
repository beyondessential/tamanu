import React, { Component } from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';

import actions from '../../actions/patients';
import {
  Modal as ModalView, InputGroup, CustomDateInput,
  BackButton, Button, AddButton, TopBar,
} from '../../components';
import Serializer from '../../utils/form-serialize';
import { bloodOptions, sexOptions, getDifferenceDate } from '../../constants';
import { PatientModel } from '../../models';

class NewPatient extends Component {
  state = {
    formError: false,
    bloodType: '',
    dateOfBirth: moment(),
    sex: '',
    age: '0 months 0 days',
    referredDate: moment(),
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
      dateOfBirth: date,
      age: getDifferenceDate(moment(), date),
    });
  }

  onChangeReferredDate = (date) => {
    this.setState({
      referredDate: date,
    });
  }

  render() {
    const {
      formError,
      dateOfBirth,
      age,
      referredDate,
      patientInProgress,
    } = this.state;
    return (
      <div className="create-content">
        <form
          className="create-container"
          onSubmit={async (e) => {
            // TODO: move this to the model
            e.preventDefault();
            const patient = Serializer.serialize(e.target, { hash: true });
            patient.dateOfBirth = moment(dateOfBirth).format('YYYY-MM-DD');
            patient.referredDate = moment(referredDate).format('YYYY-MM-DD');
            patient.age = age;

            // Clear the model to refresh id
            const _patient = new PatientModel(patient);
            if (_patient.isValid()) {
              this.props.createPatient(_patient);
            } else {
              this.setState({ formError: true });
            }
          }}
        >
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
          <div className="form">
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="firstName"
                  label="First Name"
                  required
                  tabIndex={1}
                />
              </div>
              <div className="column">
                <InputGroup
                  name="patientStatus"
                  label="Patient Status"
                  tabIndex={7}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="middleName"
                  label="Middle Name"
                  tabIndex={2}
                />
              </div>
              <div className="column">
                <InputGroup
                  name="externalPatientId"
                  label="External Patient Id"
                  tabIndex={8}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="lastName"
                  label="Last Name"
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
                  tabIndex={4}
                />
              </div>
              <div className="column">
                <InputGroup
                  name="clinicSite"
                  label="Clinic Site"
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
                  tabIndex={10}
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
                    name="dateOfBirth"
                    autoFocus
                    customInput={<CustomDateInput />}
                    selected={dateOfBirth}
                    onChange={this.onChangeDate}
                    peekNextMonth
                    showMonthDropdown
                    value={moment(dateOfBirth).format('YYYY-MM-DD')}
                    showYearDropdown
                    type="button"
                    dropdownMode="select"
                  />
                </div>
              </div>
              <div className="column">
                <div className="column">
                  <span className="header">
                    Referred Date
                  </span>
                  <DatePicker
                    name="referredDate"
                    autoFocus
                    customInput={<CustomDateInput />}
                    selected={referredDate}
                    onChange={this.onChangeReferredDate}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    value={moment(referredDate).format('YYYY-MM-DD')}
                  />
                </div>
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
                  tabIndex={11}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="placeOfBirth"
                  label="Place of Birth"
                  tabIndex={5}
                />
              </div>
              <div className="column">
                <InputGroup
                  name="parent"
                  label="Parent/Guardian"
                  tabIndex={12}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="occupation"
                  label="Occupation"
                  tabIndex={6}
                />
              </div>
              <div className="column">
                <InputGroup
                  name="paymentProfile"
                  label="Payment Profile"
                  tabIndex={13}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column is-6">
                <div className="column">
                  <span className="header">
                    Patient Type
                  </span>
                  <div>
                    <label className="radio">
                      <input type="radio" name="patientType" value="Charity" />
                      <span>Charity</span>
                    </label>
                    <label className="radio">
                      <input type="radio" name="patientType" value="Private" />
                      <span>Private</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column has-text-right">
                  <Button
                    variant="contained"
                    onClick={() => this.setState({ contactModalVisible: true })}
                  >
+ Add Contact
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="columns second-form">
            <div className="column">
              <InputGroup
                name="phone"
                label="Phone"
                tabIndex={14}
              />
              <InputGroup
                name="address"
                label="Address"
                tabIndex={15}
              />
            </div>
            <div className="column">
              <InputGroup
                name="email"
                label="Email"
                tabIndex={16}
              />
              <InputGroup
                name="country"
                label="Country"
                tabIndex={17}
              />
              <div className="column has-text-right">
                <BackButton to="/patients" />
                <AddButton
                  type="submit"
                  disabled={patientInProgress}
                />
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

function mapStateToProps(state) {
  const { createPatientSuccess, patientInProgress } = state.patients;
  return { createPatientSuccess, patientInProgress };
}

const { patient: patientActions } = actions;
const { savePatient } = patientActions;
const mapDispatchToProps = (dispatch) => ({
  createPatient: patient => dispatch(savePatient({ Model: patient })),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewPatient);
