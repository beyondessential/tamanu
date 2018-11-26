import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { has, capitalize, parseInt } from 'lodash';
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

class Appointment extends Component {
  state = {
    action: 'new',
    appointmentData: null,
    patient: null,
    loading: true,
  }

  componentWillMount() {
    const { id } = this.props.match.params;
    this.props.fetchAppointment({ id });
  }

  componentWillReceiveProps(newProps) {
    if (this.props.location.pathname !== newProps.location.pathname) {
      const { id } = newProps.match.params;
      this.props.fetchAppointment({ id });
    } else {
      this.handleChange(newProps);
    }
  }

  handleChange(props = this.props) {
    const { id } = props.match.params;
    const { appointmentModel, loading } = props;
    let {
      admissionStartDate,
      admissionEndDate,
      admissionAllDay,
      othersDate,
      othersStartTimeHrs,
      othersStartTimeMins,
      othersEndTimeHrs,
      othersEndTimeMins,
      othersAllDay,
    } = props;
    let { action } = this.state;
    if (id) action = 'update';
    if (!loading) {
      // Set initials
      if (id) {
        switch (appointmentModel.get('appointmentType')) {
          case 'admission':
            admissionStartDate = moment(appointmentModel.get('startDate'));
            admissionEndDate = moment(appointmentModel.get('endDate'));
            admissionAllDay = appointmentModel.get('allDay');
          break;
          default:
            othersDate = moment(appointmentModel.get('startDate'));
            othersStartTimeHrs = parseInt(moment(appointmentModel.get('startDate')).format('HH'));
            othersStartTimeMins = parseInt(moment(appointmentModel.get('startDate')).format('mm'));
            othersEndTimeHrs = parseInt(moment(appointmentModel.get('endDate')).format('HH')) || 0;
            othersEndTimeMins = parseInt(moment(appointmentModel.get('endDate')).format('mm')) || 0;
            othersAllDay = appointmentModel.get('allDay');
          break;
        }
      }

      this.setState({
        action,
        loading,
        admissionStartDate,
        admissionEndDate,
        admissionAllDay,
        othersDate,
        othersStartTimeHrs,
        othersStartTimeMins,
        othersEndTimeHrs,
        othersEndTimeMins,
        othersAllDay,
        appointmentData: appointmentModel.toJSON(),
      });
    }
  }

  handleUserInput = (e, field) => {
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
      const { appointmentModel } = this.props;
      appointmentModel.set(name, value, { silent: true });
      this.setState({ appointmentData: appointmentModel.toJSON() }, this.parseDates);
    }
  }

  parseDates() {
    const { surgery, appointmentModel } = this.props;
    const {
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

    if (appointmentModel.get('appointmentType') === 'admission' && !surgery) {
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
    this.setState({ appointmentData: appointmentModel.toJSON() });
  }

  submitForm(e) {
    const { surgery, appointmentModel } = this.props;
    const { action, patient } = this.state;
    e.preventDefault();
    // Parse out dates
    this.parseDates();
    // Set defaults for surgery
    if (surgery) {
      appointmentModel.set('appointmentType', 'surgery', { silent: true });
    }
    // Save appointment
    this.props.saveAppointment({
      action,
      patient,
      model: appointmentModel,
      history: this.props.history,
      surgery
    });
  }

  renderDatesAdmission() {
    const {
      othersDate,
      othersStartTimeHrs,
      othersStartTimeMins,
      othersEndTimeHrs,
      othersEndTimeMins,
      othersAllDay,
    } = this.state;

    return (
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
    );
  }

  renderDatesOthers() {
    const {
      admissionStartDate,
      admissionEndDate,
      admissionAllDay,
    } = this.state;

    return (
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
    );
  }

  renderFieldsOthers() {
    const { appointmentData } = this.state;
    return (
      <React.Fragment>
        <div className="columns">
          <SelectGroup
            className="column is-5"
            name="appointmentType"
            label="Type"
            options={visitOptions}
            value={appointmentData.appointmentType}
            onChange={this.handleUserInput}
            required
          />
          <InputGroup
            className="column is-4"
            name="provider"
            label="With"
            value={appointmentData.provider}
            onChange={this.handleUserInput}
          />
        </div>
        <div className="columns">
          <InputGroup
            className="column is-5"
            name="location"
            label="Location"
            value={appointmentData.location}
            onChange={this.handleUserInput}
          />
          <SelectGroup
            className="column is-4"
            name="status"
            label="Status"
            options={appointmentStatusList}
            value={appointmentData.status}
            onChange={this.handleUserInput}
          />
        </div>
      </React.Fragment>
    );
  }

  renderFieldsSurgery() {
    const { appointmentData } = this.state;
    return (
      <div className="columns">
        <InputGroup
          className="column is-4"
          name="provider"
          label="With"
          value={appointmentData.provider}
          onChange={this.handleUserInput}
        />
        <InputGroup
          className="column is-5"
          name="location"
          label="Location"
          value={appointmentData.location}
          onChange={this.handleUserInput}
        />
      </div>
    );
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const { surgery, appointmentModel } = this.props;
    const {
      action,
      appointmentData,
    } = this.state;

    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            {`${capitalize(action)} ${surgery?'Surgical':''} Appointment`}
          </span>
        </div>
        <form
          className="create-container"
          onSubmit={(e) => this.submitForm(e)}
        >
          <div className="form  with-padding">
            <div className="columns">
              <PatientAutocomplete
                label="Patient"
                name="patient"
                value={appointmentData.patient}
                onChange={this.handleUserInput}
                required
              />
            </div>
            <div className="columns">
              {(appointmentData.appointmentType !== 'admission' || surgery) &&
                this.renderDatesAdmission()
              }

              {appointmentData.appointmentType === 'admission' && !surgery &&
                this.renderDatesOthers()
              }
            </div>
            {!surgery &&
              this.renderFieldsOthers()
            }
            {surgery &&
              this.renderFieldsSurgery()
            }
            <div className="columns">
              <TextareaGroup
                label="Notes"
                name="notes"
                value={appointmentData.notes}
                onChange={this.handleUserInput}
              />
            </div>
            <div className="column has-text-right">
              <Link className="button is-danger cancel" to="/appointments">Cancel</Link>
              <button
                className="button is-primary" 
                type="submit" 
                disabled={!appointmentModel.isValid()}
              >
                {action === 'new' ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

Appointment.defaultProps = {
  admissionStartDate: moment().startOf('day'),
  admissionEndDate: moment().endOf('day'),
  admissionAllDay: true,
  othersDate: moment(),
  othersStartTimeHrs: 0,
  othersStartTimeMins: 0,
  othersEndTimeHrs: 0,
  othersEndTimeMins: 0,
  othersAllDay: false,
};

function mapStateToProps(state) {
  const { appointment, loading, error } = state.scheduling;
  return { 
    loading, error,
    appointmentModel: appointment, 
  };
}

const { appointment: appointmentActions } = actions;
const { fetchAppointment, saveAppointment } = appointmentActions;
const mapDispatchToProps = (dispatch, ownProps) => ({
  fetchAppointment: (params) => dispatch(fetchAppointment(params)),
  saveAppointment: (params) => dispatch(saveAppointment(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Appointment);
