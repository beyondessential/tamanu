import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import { map } from 'lodash';
import Autocomplete from 'react-autocomplete';
import ModalView from '../../components/Modal';
import Serializer from '../../utils/form-serialize';
import InputGroup from '../../components/InputGroup';
import CustomDateInput from '../../components/CustomDateInput';
import { createAppointment } from '../../actions/appointments';
import { visitOptions, appointmentStatusList } from '../../constants';
import { PatientsCollection } from '../../collections';
import { AppointmentModel } from '../../models';

class AddAppointment extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    formError: false,
    startDate: moment(),
    endDate: moment().add(1, 'd'),
    patients: [],
    patient: '',
    appointmentType: 'Admission',
    appointmentStatus: 'Scheduled'
  }

  componentDidMount() {
    this.props.collection.on('update', this.handleChange);
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    let { models: patients } = this.props.collection;
    if (patients.length > 0) patients = map(patients, patient => patient.attributes);
    this.setState({ patients });
  }

  updateValue = (value) => {
    this.setState({ selectValue: value });
  }

  manageAppointmentType = (value) => {
    this.setState({ appointmentType: value });
  }

  manageStatus = (value) => {
    this.setState({ appointmentStatus: value });
  }

  onChangeDate = (date) => {
    this.setState({
      prescriptionDate: date,
    });
  }

  onCloseModal = () => {
    this.setState({ formError: false });
  }

  render() {
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            New Appointment
          </span>
        </div>
        <form
          className="create-container"
          onSubmit={(e) => {
            e.preventDefault();
            const appointment = Serializer.serialize(e.target, { hash: true });
            appointment.patient = this.state.patient;
            appointment.startDate = this.state.startDate;
            appointment.endDate = this.state.endDate;

            const _appointment = new AppointmentModel(appointment);
            if (_appointment.isValid()) {
              console.log('_appointment_', _appointment);
              this.props.createAppointment(_appointment);
            } else {
              this.setState({ formError: true });
            }
          }}
        >
          <div className="form">
            <div className="columns">
              <div className="column">
                <div className="column">
                  <span className="input-group-title">
                    Patient <span className="isRequired">*</span>
                  </span>
                  <Autocomplete
                    inputProps={{ name: 'patient' }}
                    getItemValue={(item) => `${item.displayId} - ${item.firstName} ${item.lastName}`}
                    wrapperProps={{ className: 'autocomplete-wrapper' }}
                    items={this.state.patients}
                    value={this.state.patientRef}
                    onSelect={(value, item) => {
                      this.setState({ patientRef: value, patient: item._id });
                    }}
                    onChange={(event, value) => {
                      this.setState({ patientRef: value });
                      this.props.collection.lookUp({
                        selector: { displayId: { $regex: `(?i)${value}` } },
                        fields: ['_id', 'displayId', 'firstName', 'lastName']
                      });
                    }}
                    renderItem={(item, isHighlighted) =>
                      <div style={{ background: isHighlighted ? 'lightgray' : 'white' }}> {`${item.displayId} - ${item.firstName} ${item.lastName}`} </div>
                    }
                  />
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column is-4">
                <div className="column">
                  <span className="header">
                    Start Date <span className="isRequired">*</span>
                  </span>
                  <DatePicker
                    name="startDate"
                    customInput={<CustomDateInput />}
                    selected={this.state.startDate}
                    onChange={date => { this.setState({ startDate: date }); }}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                  />
                </div>
              </div>
              <div className="column is-4">
                <div className="column">
                  <span className="header">
                    End Date <span className="isRequired">*</span>
                  </span>
                  <DatePicker
                    name="endDate"
                    customInput={<CustomDateInput />}
                    selected={this.state.endDate}
                    onChange={date => { this.setState({ endDate: date }); }}
                    peekNextMonth
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                  />
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column is-6">
                <div className="column">
                  <span className="header">
                    Type <span className="isRequired">*</span>
                  </span>
                  <Select
                    id="state-select"
                    ref={(ref) => { this.select = ref; }}
                    onBlurResetsInput={false}
                    onSelectResetsInput={false}
                    options={visitOptions}
                    simpleValue
                    clearable={false}
                    name="appointmentType"
                    disabled={this.state.disabled}
                    value={this.state.appointmentType}
                    onChange={this.manageAppointmentType}
                    rtl={this.state.rtl}
                    searchable={this.state.searchable}
                  />
                </div>
              </div>
              <div className="column is-6">
                <InputGroup
                  name="provider"
                  label="With"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column is-6">
                <InputGroup
                  name="location"
                  label="Location"
                />
              </div>
              <div className="column is-4">
                <div className="column">
                  <span className="header">
                    Status
                  </span>
                  <Select
                    id="state-select"
                    ref={(ref) => { this.select = ref; }}
                    onBlurResetsInput={false}
                    onSelectResetsInput={false}
                    options={appointmentStatusList}
                    simpleValue
                    clearable={false}
                    name="status"
                    disabled={this.state.disabled}
                    value={this.state.appointmentStatus}
                    onChange={this.manageStatus}
                    rtl={this.state.rtl}
                    searchable={this.state.searchable}
                  />
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column">
                  <span className="header">
                    Notes
                  </span>
                  <textarea className="textarea" name="notes" />
                </div>
              </div>
            </div>
            <div className="column has-text-right">
              <Link className="button is-danger cancel" to="/appointments">Cancel</Link>
              <button className="button" type="submit">Add</button>
            </div>
          </div>
        </form>
        <ModalView
          isVisible={this.state.formError}
          onClose={this.onCloseModal}
          headerTitle="Warning!!!!"
          contentText="Please fill in required fields (marked with *) and correct the errors before saving."
          little
        />
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  createAppointment: appointment => dispatch(createAppointment(appointment, ownProps.history)),
  collection: new PatientsCollection(),
});

export default connect(undefined, mapDispatchToProps)(AddAppointment);
