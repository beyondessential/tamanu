import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import { Grid } from '@material-ui/core';
import actions from '../../actions/scheduling';
import PatientsTopRow from '../Patients/components/TopRow';
import { visitOptions, appointmentStatusList, MUI_SPACING_UNIT as spacing } from '../../constants';
import {
  Preloader,
  PatientAutocomplete,
  TextInput,
  CheckInput,
  DateInput,
  SelectInput,
  AddButton,
  UpdateButton,
  BackButton,
  TopBar,
  Container,
  ButtonGroup,
  FormRow,
  TimeInput,
  DateTimeInput,
} from '../../components';

class Appointment extends Component {
  state = {
    action: 'new',
    patient: null,
    loading: true,
    formIsValid: false,
  };

  componentWillMount() {
    const { id, patientId } = this.props.match.params;
    this.props.fetchAppointment({ id, patientId });
  }

  componentWillReceiveProps(newProps) {
    const { appointmentModel, loading } = newProps;
    if (this.props.location.pathname !== newProps.location.pathname) {
      const { id, patientId } = newProps.match.params;
      this.props.fetchAppointment({ id, patientId });
    } else if (!loading) {
      const formIsValid = true;
      appointmentModel.isValid();
      this.setState({ ...appointmentModel.attributes, formIsValid, loading });
      appointmentModel.off('change');
      appointmentModel.on('change', this.handleChange);
    }
  }

  handleUserInput = event => {
    const { name, value } = event.target;
    this.handleFormInput(name, value);
  };

  handleAutoCompleteInput = ({ _id }, name) => {
    this.handleFormInput(name, _id);
  };

  handleCheckboxInput = event => {
    const { name, checked } = event.target;
    this.handleFormInput(name, checked);
  };

  handleDateTimeInput = event => {
    const { appointmentModel } = this.props;
    const { name, value } = event.target;
    this.handleFormInput(name, value);
    // Update startDate
    if (name === 'startTime') {
      const [hour, minute] = value.split(':');
      const startDate = moment(appointmentModel.get('startDate'))
        .set('hour', hour)
        .set('minute', minute)
        .format();
      this.handleFormInput('startDate', startDate);
    }
    // Update endDate
    if (name === 'endTime') {
      const [hour, minute] = value.split(':');
      const endDate = moment(appointmentModel.get('startDate'))
        .set('hour', hour)
        .set('minute', minute)
        .format();
      this.handleFormInput('endDate', endDate);
    }
  };

  handleChange = () => {
    const { appointmentModel } = this.props;
    const formIsValid = appointmentModel.isValid();
    const changedAttributes = appointmentModel.changedAttributes();
    this.setState({ ...changedAttributes, formIsValid });
  };

  handleFormInput(name, value) {
    const { appointmentModel } = this.props;
    appointmentModel.set(name, value);
  }

  submitForm(event) {
    event.preventDefault();
    const { surgery, appointmentModel } = this.props;
    const { action, patient } = this.state;
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
      surgery,
    });
  }

  renderAdmissionDates() {
    const { startDate, startTime, endTime, allDay } = this.state;
    return (
      <FormRow>
        <DateInput
          label="Date"
          name="startDate"
          value={startDate}
          onChange={this.handleDateTimeInput}
          required
        />
        {!allDay && (
          <Grid container item>
            <Grid item xs>
              <TimeInput
                label="Start Time"
                name="startTime"
                value={startTime}
                onChange={this.handleDateTimeInput}
                required
              />
            </Grid>
            <Grid item xs>
              <TimeInput
                label="End Time"
                name="endTime"
                value={endTime}
                onChange={this.handleDateTimeInput}
                required
              />
            </Grid>
          </Grid>
        )}
        <CheckInput
          label="All Day"
          name="allDay"
          onChange={this.handleCheckboxInput}
          value={allDay}
        />
      </FormRow>
    );
  }

  renderOtherDates() {
    const { startDate, endDate, allDay } = this.state;
    const DateComponent = allDay ? DateInput : DateTimeInput;
    return (
      <FormRow>
        <DateComponent
          label="Start Date"
          name="startDate"
          value={startDate}
          onChange={this.handleUserInput}
          required
        />
        <DateComponent
          label="End Date"
          name="endDate"
          value={endDate}
          onChange={this.handleUserInput}
          required
        />
        <CheckInput
          label="All Day"
          name="allDay"
          onChange={this.handleCheckboxInput}
          value={allDay}
        />
      </FormRow>
    );
  }

  renderFields() {
    const { appointmentType, provider, location, status } = this.state;
    return (
      <React.Fragment>
        <FormRow>
          <SelectInput
            name="appointmentType"
            label="Type"
            options={visitOptions}
            value={appointmentType}
            onChange={this.handleUserInput}
            required
          />
          <TextInput
            name="provider"
            label="With"
            value={provider}
            onChange={this.handleUserInput}
          />
        </FormRow>
        <FormRow>
          <TextInput
            name="location"
            label="Location"
            value={location}
            onChange={this.handleUserInput}
          />
          <SelectInput
            name="status"
            label="Status"
            options={appointmentStatusList}
            value={status}
            onChange={this.handleUserInput}
          />
        </FormRow>
      </React.Fragment>
    );
  }

  renderSurgeryFields() {
    const { provider, location } = this.state;
    return (
      <FormRow>
        <TextInput name="provider" label="With" value={provider} onChange={this.handleUserInput} />
        <TextInput
          name="location"
          label="Location"
          value={location}
          onChange={this.handleUserInput}
        />
      </FormRow>
    );
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const { surgery, patient } = this.props;
    const { action, formIsValid, ...form } = this.state;
    return (
      <React.Fragment>
        <TopBar title={`${capitalize(action)} ${surgery ? 'Surgical' : ''} Appointment`} />
        <form onSubmit={e => this.submitForm(e)}>
          <Container>
            <Grid container spacing={spacing * 2} direction="column">
              <Grid item>
                {patient ? (
                  <PatientsTopRow patient={patient.toJSON()} />
                ) : (
                  <PatientAutocomplete
                    label="Patient"
                    name="patient"
                    value={form.patient}
                    onChange={this.handleAutoCompleteInput}
                    required
                  />
                )}
              </Grid>
              {(form.appointmentType !== 'admission' || surgery) && this.renderAdmissionDates()}
              {form.appointmentType === 'admission' && !surgery && this.renderOtherDates()}
              {surgery ? this.renderSurgeryFields() : this.renderFields()}
              <Grid item>
                <TextInput
                  label="Notes"
                  name="notes"
                  value={form.notes}
                  onChange={this.handleUserInput}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid container item justify="flex-end">
                <ButtonGroup>
                  <BackButton />
                  {action === 'new' ? (
                    <AddButton
                      type="submit"
                      disabled={!formIsValid}
                      can={{ do: 'update', on: 'appointment' }}
                    />
                  ) : (
                    <UpdateButton
                      type="submit"
                      disabled={!formIsValid}
                      can={{ do: 'update', on: 'appointment' }}
                    />
                  )}
                </ButtonGroup>
              </Grid>
            </Grid>
          </Container>
        </form>
      </React.Fragment>
    );
  }
}

Appointment.propTypes = {
  appointmentModel: PropTypes.instanceOf(Object).isRequired,
  fetchAppointment: PropTypes.func.isRequired,
  saveAppointment: PropTypes.func.isRequired,
  surgery: PropTypes.bool,
  patient: PropTypes.instanceOf(Object),
};

Appointment.defaultProps = {
  surgery: false,
  patient: {},
};

function mapStateToProps(state) {
  const { appointment, patient, loading, error } = state.scheduling;
  return {
    loading,
    error,
    patient,
    appointmentModel: appointment,
  };
}

const { appointment: appointmentActions } = actions;
const { fetchAppointment, saveAppointment } = appointmentActions;
const mapDispatchToProps = dispatch => ({
  fetchAppointment: params => dispatch(fetchAppointment(params)),
  saveAppointment: params => dispatch(saveAppointment(params)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Appointment);
