import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toLower } from 'lodash';
import actions from '../../../actions/scheduling';
import { Modal, Button, BrowsableTable } from '../../../components';
import { AppointmentsCollection } from '../../../collections';
import { appointmentsColumns } from '../../../constants';

const prepareRow = (model) => {
  const patient = model.parents.patients[0];
  return {
    ...model.toJSON(),
    patientsName: patient.getDisplayName(),
  };
};

class AppointmentsTable extends Component {
  state = {
    appointments: [{}],
    loading: true,
    deleteModalVisible: false,
    selectedAppointment: null,
    keys: this.props.keys,
  }

  componentWillMount() {
    appointmentsColumns[appointmentsColumns.length - 1].Cell = this.setActionsColumn;
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <Button
          onClick={() => this.goEdit(row._id)}
          color="secondary"
          variant="contained"
          can={{ do: 'update', on: 'appointment' }}
        >
          Edit
        </Button>
        {toLower(row.status) === 'scheduled'
          && (
          <Button
            onClick={() => this.checkIn(row.patients[0]._id)}
            color="primary"
            variant="contained"
          >
            Check In
          </Button>
          )
        }
        <Button
          onClick={() => this.showDeleteModal(row)}
          color="primary"
          variant="outlined"
          can={{ do: 'delete', on: 'appointment' }}
        >
          Delete
        </Button>
      </div>
    );
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
      selectedAppointment: appointment,
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
    const { filters } = this.props;
    return (
      <React.Fragment>
        <div className="detail">
          <BrowsableTable
            collection={this.props.collection}
            columns={appointmentsColumns}
            emptyNotification="No appointments found"
            transformRow={prepareRow}
            fetchOptions={filters}
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
  filters: PropTypes.object.isRequired,
  autoFetch: PropTypes.bool,
};

AppointmentsTable.defaultProps = {
  autoFetch: false,
};

function mapStateToProps(state) {
  const {
    appointments, totalPages, loading, reFetch, error,
  } = state.scheduling;
  return {
    appointments,
    totalPages,
    loading,
    reFetch,
    error,
    collection: new AppointmentsCollection(),
  };
}

const {
  appointments: appointmentsActions,
  appointment: appointmentActions,
} = actions;
const { fetchAppointments } = appointmentsActions;
const { deleteAppointment } = appointmentActions;
const mapDispatchToProps = dispatch => ({
  fetchAppointments: (props) => dispatch(fetchAppointments(props)),
  deleteAppointment: (props) => dispatch(deleteAppointment(props)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AppointmentsTable);
