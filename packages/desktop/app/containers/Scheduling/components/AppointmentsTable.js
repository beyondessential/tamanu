import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { toLower } from 'lodash';
import { Paper } from '@material-ui/core';
import actions from '../../../actions/scheduling';
import {
  Dialog, Button, BrowsableTable, ButtonGroup, Container,
} from '../../../components';
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
    deleteModalVisible: false,
    selectedAppointment: null,
  }

  componentWillMount() {
    appointmentsColumns[appointmentsColumns.length - 1].Cell = this.setActionsColumn;
  }

  setActionsColumn = ({ original: row }) => (
    <ButtonGroup>
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
    </ButtonGroup>
  )

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
    const { filters, collection } = this.props;
    return (
      <Container
        autoHeight
        noPadding
      >
        <BrowsableTable
          collection={collection}
          columns={appointmentsColumns}
          emptyNotification="No appointments found"
          transformRow={prepareRow}
          fetchOptions={filters}
        />
        <Dialog
          dialogType="confirm"
          headerTitle="Confirm"
          contentText="Are you sure you want to delete this appointment?"
          isVisible={this.state.deleteModalVisible}
          onConfirm={this.deleteAppointment}
          onClose={this.onCloseModal}
        />
      </Container>
    );
  }
}

AppointmentsTable.propTypes = {
  filters: PropTypes.instanceOf(Object).isRequired,
  deleteAppointment: PropTypes.func.isRequired,
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
