import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';

import ModalView from '../../components/Modal';
import AddContactModal from './components/AddContactModal';
import InputGroup from '../../components/InputGroup';
import CustomDateInput from '../../components/CustomDateInput';
import Serializer from '../../utils/form-serialize';
import { createPatient, createPatientIndexes } from '../../actions/patients';
import { bloodOptions, sexOptions, getDifferenceDate, getDisplayId } from '../../constants';
import { Patient as PatientModel } from '../../models';

class NewPatient extends Component {
  // constructor(props) {
  //   super(props);
  //   // this.handleChange = this.handleChange.bind(this);
  // }

  state = {
    formError: false,
    bloodType: '',
    birthday: moment(),
    sex: '',
    age: '0 months 0 days',
    referredDate: moment(),
    contactModalVisible: false
  }

  componentDidMount() {
    // this.props.createPatientIndexes();
  }

  onCloseModal = () => {
    this.setState({ formError: false });
  }

  onCloseContactModal = () => {
    this.setState({ contactModalVisible: false });
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
      age: getDifferenceDate(moment(), date)
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
      birthday,
      age,
      referredDate,
      contactModalVisible
    } = this.state;
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
          onSubmit={async (e) => {
            // TODO: move this to the model
            e.preventDefault();
            const patient = Serializer.serialize(e.target, { hash: true });
            patient.birthday = moment(birthday).format('YYYY-MM-DD');
            patient.referredDate = moment(referredDate).format('YYYY-MM-DD');
            patient.age = age;
            patient.displayId = await getDisplayId('P');

            const patientRecord = new PatientModel(patient);
            if (patientRecord.isValid()) {
              patientRecord.save();
              this.props.history.push('/patients');
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
                    name="birthday"
                    autoFocus
                    customInput={<CustomDateInput />}
                    selected={birthday}
                    onChange={this.onChangeDate}
                    peekNextMonth
                    showMonthDropdown
                    value={moment(birthday).format('YYYY-MM-DD')}
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
                  <a className="button is-primary" onClick={() => this.setState({ contactModalVisible: true })}>+ Add Contact</a>
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
        <AddContactModal
          isVisible={contactModalVisible}
          onClose={this.onCloseContactModal}
          little
        />
      </div>
    );
  }
}

NewPatient.defaultProps = {
  model: new PatientModel(),
  patients: []
};

export default NewPatient;

// function mapStateToProps(state) {
//   const { createPatientSuccess } = state.patients;
//   return {
//     createPatientSuccess,
//   };
// }

// const mapDispatchToProps = dispatch => ({
//   createPatient: patient => dispatch(createPatient(patient)),
//   createPatientIndexes: () => dispatch(createPatientIndexes())
// });

// export default connect(mapStateToProps, mapDispatchToProps)(NewPatient);
