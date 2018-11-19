import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { isEmpty } from 'lodash';
import moment from 'moment';
import ReactTable from 'react-table';
import Button from '@material-ui/core/Button';
import SearchForm from './components/SearchForm';
import actions from '../../actions/scheduling';
import {
  appointmentsColumns,
  dbViews,
  pageSizes
} from '../../constants';

class SearchAppointment extends Component {
  constructor(props) {
    super(props);
    this.submitForm = this.submitForm.bind(this);
  }

  state = {
    appointments: [{}],
    keys: [],
    totalPages: 0,
    loading: true,
  }

  componentWillMount() {
    appointmentsColumns[appointmentsColumns.length - 1].Cell = this.setActionsColumn;
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { appointments, totalPages, loading } = props;
    if (!loading) this.setState({ appointments, totalPages, loading });
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <Button color="default" variant="contained" onClick={() => this.goEdit(row._id)}>Edit</Button>
        <Button color="primary" variant="contained" classes={{ root: 'm-l-5' }} onClick={() => this.checkIn(row._id)}>
          <i className="fa fa-sign-in p-r-5" /> Check In
        </Button>
        <Button color="secondary" variant="contained" classes={{ root: 'm-l-5' }} onClick={() => this.showDeleteModal(row)}>Delete</Button>
      </div>
    );
  }

  goEdit = (id) => {
    this.props.history.push(`/appointments/appointment/${id}`);
  }

  checkIn = (id) => {
    this.props.history.push(`/appointments/check-in/${id}`);
  }

  submitForm(form) {
    const keys = [moment(form.startDate).startOf('day'), moment().add(100, 'years'), form.status, form.type, form.practitioner];
    this.setState({ keys }, () => this.fetchData({ page: 0 }));
  }

  fetchData = opts => {
    const { keys } = this.state;
    if (!isEmpty(keys)) {
      this.props.fetchAppointments({
        view: dbViews.appointmentsSearch,
        keys,
        ...opts
      });
    } else {
      this.setState({
        appointments: [],
        totalPages: 1,
        loading: false
      });
    }
  }

  render() {
    const {
      appointments,
      totalPages,
      loading,
    } = this.state;

    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            Search Appointments
          </span>
          <div className="view-action-buttons">
            <Link to="/appointments/appointment/new">
              <i className="fa fa-plus" /> New Appointment
            </Link>
          </div>
        </div>
        <div className="create-container">
          <div className="form with-padding">
            <SearchForm
              loading={loading}
              onSubmit={this.submitForm}
            />
            <div className="columns">
              <div className="column">
                <ReactTable
                  manual
                  keyField="_id"
                  data={appointments}
                  pages={totalPages}
                  defaultPageSize={pageSizes.appointments}
                  loading={loading}
                  columns={appointmentsColumns}
                  className="-striped"
                  defaultSortDirection="asc"
                  onFetchData={this.fetchData}
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
