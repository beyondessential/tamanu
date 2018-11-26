import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ReactTable from 'react-table';
import { toLower, isEmpty, isEqual } from 'lodash';
import actions from '../../../actions/scheduling';
import { Modal, Button } from '../../../components';
import {
  appointmentsColumns,
  dbViews,
  pageSizes,
} from '../../../constants';

class AppointmentsTable extends Component {
  state = {
    appointments: [{}],
    loading: true,
    deleteModalVisible: false,
    selectedAppointment: null,
    keys: [],
  }

  componentWillMount() {
    appointmentsColumns[appointmentsColumns.length - 1].Cell = this.setActionsColumn;
  }

  componentDidMount() {
    const { autoFetch } = this.props;
    if (autoFetch) this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { appointments, totalPages, loading, reFetch, keys } = props;
    const { keys: oldKeys } = this.state;
    if (reFetch) {
      this.onCloseModal();
      return this.fetchData({ page: 0 });
    }
    if (!loading) this.setState({ appointments, totalPages, loading, keys }, () => {
      if (!isEqual(oldKeys, keys)) this.fetchData({ page: 0 });
    });
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <Button
          onClick={() => this.goEdit(row._id)}
          color="secondary"
          variant="contained"
        >
          Edit
        </Button>
        {toLower(row.status) === 'scheduled' &&
          <Button
            onClick={() => this.checkIn(row.patients[0]._id)}
            color="primary"
            variant="contained"
          >
            Check In
          </Button>
        }
        <Button
          onClick={() => this.showDeleteModal(row)}
          color="primary"
          variant="outlined"
        >
          Delete
        </Button>
      </div>
    );
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

  goEdit = (id) => {
    this.props.history.push(`/appointments/appointment/${id}`);
  }

  checkIn = (patientId) => {
    this.props.history.push(`/patients/check-in/${patientId}`);
  }

  showDeleteModal = (appointment) => {
    this.setState({
      deleteModalVisible: true,
      selectedAppointment: appointment
    });
  }

  onCloseModal = () => {
    this.setState({ deleteModalVisible: false });
  }

  deleteAppointment = () => {
    const { selectedAppointment } = this.state;
    this.props.deleteAppointment(selectedAppointment);
  }

  render() {
    const {
      loading,
      totalPages,
      appointments,
    } = this.state;

    return (
      <React.Fragment>
        <div className="detail">
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
        <Modal
          modalType="confirm"
          headerTitle="Confirm"
          contentText="Are you sure you want to delete this appointment?"
          isVisible={this.state.deleteModalVisible}
          onConfirm={this.deleteAppointment.bind(this)}
          onClose={this.onCloseModal.bind(this)}
        />
      </React.Fragment>
    );
  }
}

AppointmentsTable.propTypes = {
  keys: PropTypes.array.isRequired,
  autoFetch: PropTypes.bool,
}

AppointmentsTable.defaultProps = {
  autoFetch: false,
}

function mapStateToProps(state) {
  const { appointments, totalPages, loading, reFetch, error } = state.scheduling;
  return { appointments, totalPages, loading, reFetch, error };
}

const {
  appointments: appointmentsActions,
  appointment: appointmentActions
} = actions;
const { fetchAppointments } = appointmentsActions;
const { deleteAppointment } = appointmentActions;
const mapDispatchToProps = dispatch => ({
  fetchAppointments: (props) => dispatch(fetchAppointments(props)),
  deleteAppointment: (props) => dispatch(deleteAppointment(props)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppointmentsTable);

