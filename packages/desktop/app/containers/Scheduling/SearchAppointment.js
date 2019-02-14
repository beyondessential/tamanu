import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import SearchForm from './components/SearchForm';
import actions from '../../actions/scheduling';
import AppointmentsTable from './components/AppointmentsTable';
import { TopBar } from '../../components';

class SearchAppointment extends Component {
  constructor(props) {
    super(props);
    this.submitForm = this.submitForm.bind(this);
  }

  state = {
    keys: [],
    loading: false,
  }

  submitForm(form) {
    const keys = [moment(form.startDate).startOf('day'), moment().add(100, 'years'), form.status, form.type, form.practitioner];
    this.setState({ keys });
  }

  onLoading(loading) {
    this.setState({ loading });
  }

  render() {
    const {
      keys,
      loading,
    } = this.state;

    return (
      <div className="create-content">
        <TopBar
          title="Search Appointments"
          buttons={{
            to: "/appointments/appointment/new",
            can: { do: 'create', on: 'appointment' },
            children: 'New Appointment'
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
                    keys={keys}
                    history={this.props.history}
                    onLoading={this.onLoading.bind(this)}
                    reFetch
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
  const { appointments, totalPages, loading, error } = state.scheduling;
  return { appointments, totalPages, loading, error };
}

const { appointments: appointmentsActions } = actions;
const { fetchAppointments } = appointmentsActions;
const mapDispatchToProps = dispatch => ({
  fetchAppointments: (props) => dispatch(fetchAppointments(props)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchAppointment);
