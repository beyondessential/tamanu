import React, { Component } from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { Link } from 'react-router-dom';

import AddContactModal from '../components/AddContactModal';
import InputGroup from '../../../components/InputGroup';
import CustomDateInput from '../../../components/CustomDateInput';
import Serializer from '../../../utils/form-serialize';

import { bloodOptions, sexOptions, getDifferenceDate } from '../../../constants';

import { setUpdatedBirthday, setUpdatedReferredDate } from '../../../actions/patients';

class General extends Component {
  state = {
    // formError: false,
    bloodType: this.props.patient.bloodType,
    birthday: moment(this.props.patient.birthday),
    sex: this.props.patient.sex,
    age: '0 months 0 days',
    referredDate: moment(this.props.patient.referredDate),
    contactModalVisible: false,
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
    this.props.setUpdatedBirthday(date);
  }

  onChangeReferredDate = (date) => {
    this.setState({
      referredDate: date,
    });
    this.props.setUpdatedReferredDate(date);
  }

  onCloseContactModal = () => {
    this.setState({ contactModalVisible: false });
  }

  render() {
    const { patient } = this.props;
    const {
      birthday,
      age,
      referredDate,
      contactModalVisible
    } = this.state;
    return (
      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = Serializer.serialize(e.target, { hash: true });
            this.updatePatient(data);
          }}
        >
          <div className="form no-margin">
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="firstName"
                  label="First Name"
                  value={patient.firstName}
                  required
                  tabIndex={1}
                />
              </div>
              <div className="column">
                <InputGroup
                  name="status"
                  label="Patient Status"
                  value={patient.status}
                  tabIndex={7}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="middleName"
                  label="Middle Name"
                  value={patient.middleName}
                  tabIndex={2}
                />
              </div>
              <div className="column">
                <InputGroup
                  name="externalPatientId"
                  label="External Patient Id"
                  value={patient.externalPatientId}
                  tabIndex={8}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="lastName"
                  label="Last Name"
                  value={patient.lastName}
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
                  value={patient.culturalName}
                  tabIndex={4}
                />
              </div>
              <div className="column">
                <InputGroup
                  name="clinic"
                  label="Clinic Site"
                  value={patient.clinic}
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
                  value={patient.referredBy}
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
                  value={patient.religion}
                  tabIndex={11}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="placeOfBirth"
                  label="Place of Birth"
                  value={patient.placeOfBirth}
                  tabIndex={5}
                />
              </div>
              <div className="column">
                <InputGroup
                  name="parent"
                  label="Parent/Guardian"
                  value={patient.parent}
                  tabIndex={12}
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="occupation"
                  label="Occupation"
                  value={patient.occupation}
                  tabIndex={6}
                />
              </div>
              <div className="column">
                {/* Not sure about this type */}
                <InputGroup
                  name="paymentProfile"
                  label="Payment Profile"
                  value={patient.paymentProfile}
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
                value={patient.phone}
                tabIndex={14}
              />
              <InputGroup
                name="address"
                label="Address"
                value={patient.address}
                tabIndex={15}
              />
            </div>
            <div className="column">
              <InputGroup
                name="email"
                label="Email"
                value={patient.email}
                tabIndex={16}
              />
              <InputGroup
                name="country"
                label="Country"
                value={patient.country}
                tabIndex={17}
              />
            </div>
          </div>
          <AddContactModal
            isVisible={contactModalVisible}
            onClose={this.onCloseContactModal}
            little
          />
          <div className="column has-text-right">
            <Link className="button is-danger cancel" to="/patients">Return</Link>
            <button className="button is-primary" type="submit">Update</button>
          </div>
        </form>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  setUpdatedBirthday: date => dispatch(setUpdatedBirthday(date)),
  setUpdatedReferredDate: date => dispatch(setUpdatedReferredDate(date)),
});

export default connect(undefined, mapDispatchToProps)(General);
