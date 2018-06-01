import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactTable from 'react-table';
import { map, isEmpty } from 'lodash';
import { Colors } from '../../constants';
import { AppointmentCollection } from '../../collections';
import DeleteAppointmentModal from './components/DeleteAppointmentModal';

class WeekAppointment extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    deleteModalVisible: false,
    selectedAppointment: null,
    pageSize: 5
  }

  componentDidMount() {
    this.props.collection.on('update', this.handleChange);
    this.props.collection.setPageSize(this.state.pageSize);
    this.props.collection.fetchResults();
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    this.forceUpdate();
  }

  onFetchData = (state) => {
    this.props.collection.setPage(state.page);
    this.props.collection.setPageSize(state.pageSize);

    // this.setState({ loading: true });
    this.props.collection.fetchResults({
      success: () => {
        // this.setState({ loading: false });
      }
    });
  }

  goEdit = (patientId) => {
    this.props.history.push(`/patients/editPatient/${patientId}`);
  }

  goAdmit = (patientId, patient) => {
    if (patient.admitted) {
      this.props.history.push(`/patients/editvisit/${patientId}`);
    } else {
      this.props.history.push(`/patients/checkin/${patientId}`);
    }
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

  onDeleteAppointment = () => {
    let { selectedAppointment } = this.state;
    selectedAppointment = this.props.collection.findWhere({ _id: selectedAppointment._id });
    if (!isEmpty(selectedAppointment)) {
      selectedAppointment.destroy({
        wait: true,
        success: () => this.onCloseModal()
      });
    }
  }

  render() {
    const that = this;
    const { deleteModalVisible } = this.state;
    let { models: appointments } = this.props.collection;
    if (appointments.length > 0) appointments = map(appointments, appointment => appointment.attributes);
    const appointmentColumns = [{
      accessor: 'date',
      Header: 'Date',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 100
    }, {
      accessor: 'name',
      Header: 'Name',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 100
    }, {
      accessor: 'type',
      Header: 'Type',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }, {
      accessor: 'location',
      Header: 'Location',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 100
    }, {
      accessor: 'with',
      Header: 'With',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }, {
      accessor: 'status',
      Header: 'Status',
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 80
    }, {
      accessor: row => {
        return { _id: row._id, admitted: row.admitted };
      },
      id: 'actions',
      Header: 'Actions',
      headerStyle: {
        backgroundColor: Colors.searchTintColor
      },
      style: {
        backgroundColor: Colors.white,
        height: '60px',
        color: '#2f4358',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      minWidth: 250,
      Cell: row => {
        return (
          <div key={row._id}>
            <button className="button column-button" onClick={() => that.goEdit(row.value._id)}>Edit</button>
            <button className="button is-primary column-checkin-button" onClick={() => that.goAdmit(row.value._id, row.value.admitted)}>{row.value.admitted ? 'Discharge' : 'Admit'}</button>
            <button className="button is-danger column-button" onClick={() => that.showDeleteModal(row)}>Delete</button>
          </div>
        );
      }
    }];
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Appointments This Week
          </span>
          <div className="view-action-buttons">
            <Link to="/appointments/edit/new">
              + New Appointment
            </Link>
          </div>
        </div>
        <div className="detail">
          <ReactTable
            manual
            keyField="_id"
            data={appointments}
            pages={this.props.collection.totalPages}
            defaultPageSize={5}
            // loading={this.state.loading}
            columns={appointmentColumns}
            className="-striped"
            defaultSortDirection="asc"
            onFetchData={this.onFetchData}
          />
        </div>
        <DeleteAppointmentModal
          isVisible={deleteModalVisible}
          onClose={this.onCloseModal}
          onDelete={this.onDeleteAppointment}
          little
        />
      </div>
    );
  }
}

WeekAppointment.defaultProps = {
  collection: new AppointmentCollection(),
  appointments: []
};

export default WeekAppointment;
