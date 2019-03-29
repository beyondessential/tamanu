import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import SearchForm from './components/SearchForm';
import actions from '../../actions/scheduling';
import AppointmentsTable from './components/AppointmentsTable';
import { TopBar } from '../../components';
import { REALM_DATE_FORMAT } from '../../constants';

class SearchAppointment extends Component {
  constructor(props) {
    super(props);
    this.submitForm = this.submitForm.bind(this);
  }

  state = {
    filters: {},
    loading: false,
  }

  onLoading = (loading) => {
    this.setState({ loading });
  }

  submitForm(form) {
    const filters = {};
    if (form.startDate) filters.startDate = `>|${moment(form.startDate).startOf('day').format(REALM_DATE_FORMAT)}`;
    if (form.status) filters.status = `LIKE|${form.status}`;
    if (form.type) filters.appointmentType = `LIKE|${form.type}`;
    if (form.practitioner) filters.provider = `CONTAINS[c]|${form.practitioner}`;
    this.setState({ filters });
  }

  render() {
    const {
      filters,
      loading,
    } = this.state;

    return (
      <div className="create-content">
        <TopBar
          title="Search Appointments"
          buttons={{
            to: '/appointments/appointment/new',
            can: { do: 'create', on: 'appointment' },
            children: 'New Appointment',
          }}
        />
        <div className="create-container">
          <div className="form with-padding">
            <SearchForm
              loading={loading}
              onSubmit={this.submitForm}
            />
            <div className="columns">
              <div className="column">
                <AppointmentsTable
                  filters={filters}
                  history={this.props.history}
                  onLoading={this.onLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const {
    appointments, totalPages, loading, error,
  } = state.scheduling;
  return {
    appointments, totalPages, loading, error,
  };
}

const { appointments: appointmentsActions } = actions;
const { fetchAppointments } = appointmentsActions;
const mapDispatchToProps = dispatch => ({
  fetchAppointments: (props) => dispatch(fetchAppointments(props)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchAppointment);
