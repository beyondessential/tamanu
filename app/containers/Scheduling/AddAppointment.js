import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { has, capitalize } from 'lodash';
import actions from '../../actions/scheduling';
import {
  visitOptions,
  appointmentStatusList,
  timeSelectOptions,
  dateFormat,
  dateTimeFormat
} from '../../constants';
import {
  Preloader,
  PatientAutocomplete,
  InputGroup,
  CheckboxGroup,
  TextareaGroup,
  DatepickerGroup,
  SelectGroup,
} from '../../components';

import { AddButton, BackButton } from '../../components/Button';

class AddAppointment extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.submitForm = this.submitForm.bind(this);
  }

  state = {
    action: 'New',
    appointmentModel: '',
    appointment: '',
    patient: '',
    admissionStartDate: moment().startOf('day'),
    admissionEndDate: moment().endOf('day'),
    admissionAllDay: true,
    othersDate: moment(),
    othersStartTimeHrs: 0,
    othersStartTimeMins: 0,
    othersEndTimeHrs: 0,
    othersEndTimeMins: 0,
    othersAllDay: false,
    loading: true,
  }

  componentWillMount() {
    const { id } = this.props.match.params;
    this.props.fetchAppointment({ id });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { id } = this.props.match.params;
    const { appointment, loading } = props;
    let { action } = this.state;
    if (id) action = 'Update';
    if (!loading) {
      this.setState({
        action,
        loading,
        appointmentModel: appointment,
        appointment: appointment.toJSON(),
      });
    }
  }

  handleUserInput = (e, field) => {
    const { appointmentModel } = this.state;
    let name = '';
    let value = '';
    if (typeof field !== 'undefined') {
      name = field;
      value = e;
    } else {
      ({ name } = e.target);
      value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    }

    if (has(this.state, name)) {
      this.setState({ [name]: value }, this.parseDates);
    } else {
      appointmentModel.set(name, value, { silent: true });
      this.setState({ appointmentModel, appointment: appointmentModel.toJSON() }, this.parseDates);
    }
  }

  parseDates() {
    const {
      appointmentModel,
      admissionStartDate,
      admissionEndDate,
      admissionAllDay,
      othersDate,
      othersStartTimeHrs,
      othersStartTimeMins,
      othersEndTimeHrs,
      othersEndTimeMins,
      othersAllDay,
    } = this.state;

    if (appointmentModel.get('appointmentType') === 'admission') {
      appointmentModel.set({
        startDate: admissionStartDate,
        endDate: admissionEndDate,
        allDay: admissionAllDay
      }, { silent: true });
    } else {
      appointmentModel.set({
        startDate: moment(othersDate).hours(othersStartTimeHrs).minutes(othersStartTimeMins),
        endDate: moment(othersDate).hours(othersEndTimeHrs).minutes(othersEndTimeMins),
        allDay: othersAllDay
      }, { silent: true });
    }
    // Update state
    this.setState({ appointmentModel, appointment: appointmentModel.toJSON() });
  }

  submitForm(e) {
    e.preventDefault();
    const { action, appointmentModel, patient } = this.state;
    // Parse out dates
    this.parseDates();
    // Save appointment
    this.props.saveAppointment({
      action,
      patient,
      model: appointmentModel,
      history: this.props.history
    });
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const {
      action,
      appointmentModel,
      appointment,
      admissionStartDate,
      admissionEndDate,
      admissionAllDay,
      othersDate,
      othersStartTimeHrs,
      othersStartTimeMins,
      othersEndTimeHrs,
      othersEndTimeMins,
      othersAllDay,
    } = this.state;

    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            {capitalize(action)} Appointment
          </span>
        </div>
        <form
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="form  with-padding">
            <div className="columns">
              <PatientAutocomplete
                label="Patient"
                name="patient"
                value={appointment.patient}
                onChange={this.handleUserInput}
                required
              />
            </div>
            <div className="columns">
              {appointment.appointmentType !== 'admission' &&
                <React.Fragment>
                  <DatepickerGroup
                    className="column is-3"
                    label="Date"
                    name="othersDate"
                    value={othersDate}
                    onChange={this.handleUserInput}
                    required
                  />
                  {!othersAllDay &&
                    <React.Fragment>
                      <SelectGroup
                        className="column is-1"
                        label="Start Time"
                        name="othersStartTimeHrs"
                        options={timeSelectOptions.hours}
                        value={othersStartTimeHrs}
                        onChange={this.handleUserInput}
                        searchable
                        required
                      />
                      <SelectGroup
                        className="column is-1 p-t-40"
                        label={false}
                        name="othersStartTimeMins"
                        options={timeSelectOptions.minutes}
                        value={othersStartTimeMins}
                        onChange={this.handleUserInput}
                        searchable
                      />
                      <SelectGroup
                        className="column is-1"
                        label="End Time"
                        name="othersEndTimeHrs"
                        options={timeSelectOptions.hours}
                        value={othersEndTimeHrs}
                        onChange={this.handleUserInput}
                        required
                      />
                      <SelectGroup
                        className="column is-1 p-t-40"
                        label={false}
                        name="othersEndTimeMins"
                        options={timeSelectOptions.minutes}
                        value={othersEndTimeMins}
                        onChange={this.handleUserInput}
                      />
                    </React.Fragment>
                  }
                  <CheckboxGroup
                    label="All Day"
                    name="othersAllDay"
                    defaultChecked={othersAllDay}
                    onChange={this.handleUserInput}
                    value
                  />
                </React.Fragment>
              }

              {appointment.appointmentType === 'admission' &&
                <React.Fragment>
                  <DatepickerGroup
                    className="column is-3"
                    label="Start Date"
                    name="admissionStartDate"
                    value={admissionStartDate}
                    onChange={this.handleUserInput}
                    showTimeSelect={!admissionAllDay}
                    dateFormat={admissionAllDay?dateFormat:dateTimeFormat}
                    timeIntervals={30}
                    required
                  />
                  <DatepickerGroup
                    className="column is-3"
                    label="End Date"
                    name="admissionEndDate"
                    value={admissionEndDate}
                    onChange={this.handleUserInput}
                    showTimeSelect={!admissionAllDay}
                    dateFormat={admissionAllDay?dateFormat:dateTimeFormat}
                    minDate={admissionStartDate}
                    timeIntervals={30}
                    required
                  />
                  <CheckboxGroup
                    label="All Day"
                    name="admissionAllDay"
                    defaultChecked={admissionAllDay}
                    onChange={this.handleUserInput}
                    value
                  />
                </React.Fragment>
              }
            </div>
            <div className="columns">
              <SelectGroup
                className="column is-5"
                name="appointmentType"
                label="Type"
                options={visitOptions}
                value={appointment.appointmentType}
                onChange={this.handleUserInput}
                required
              />
              <InputGroup
                className="column"
                name="provider"
                label="With"
                onChange={this.handleUserInput}
              />
            </div>
            <div className="columns">
              <InputGroup
                className="column is-5"
                name="location"
                label="Location"
                onChange={this.handleUserInput}
              />
              <SelectGroup
                className="column is-4"
                name="status"
                label="Status"
                options={appointmentStatusList}
                value={appointment.status}
                onChange={this.handleUserInput}
              />
            </div>
            <div className="columns">
              <TextareaGroup
                label="Notes"
                name="notes"
                value={appointment.notes}
                onChange={this.handleUserInput}
              />
            </div>
            <div className="column has-text-right">
              <BackButton to="/appointments" />
              <AddButton
                disabled={ !appointmentModel.isValid() }
              />
            </div>
          </div>
        </form>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { appointment, loading, error } = state.scheduling;
  return { appointment, loading, error };
}

const { appointment: appointmentActions } = actions;
const { fetchAppointment, saveAppointment } = appointmentActions;
const mapDispatchToProps = (dispatch, ownProps) => ({
  fetchAppointment: (params) => dispatch(fetchAppointment(params)),
  saveAppointment: (params) => dispatch(saveAppointment(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AddAppointment);
