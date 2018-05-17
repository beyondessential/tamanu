import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchPatients, deletePatient } from '../../actions/patients';
import { Colors, headerSortingStyle } from '../../constants';
import DeletePatientModal from './components/DeletePatientModal';

class PatientListing extends Component {
  state = {
    deleteModalVisible: false,
    selectedPatient: null,
  }

  componentDidMount() {
    this.props.fetchPatients();
  }

  componentWillReceiveProps({ deletePatientSuccess }) {
    if (deletePatientSuccess) {
      this.props.fetchPatients();
    }
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

  showDeleteModal = (patient) => {
    this.setState({
      deleteModalVisible: true,
      selectedPatient: patient
    });
  }

  onCloseModal = () => {
    this.setState({ deleteModalVisible: false });
  }

  onDeletePatient = () => {
    const { selectedPatient } = this.state;
    this.props.deletePatient(selectedPatient);
    this.onCloseModal();
  }

  render() {
    const { deleteModalVisible } = this.state;
    const { patients } = this.props;
    const that = this;
    const patientColumns = [{
      dataField: 'displayId',
      text: 'Id',
      sort: true,
      headerSortingStyle,
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
        width: '10%'
      },
    }, {
      dataField: 'firstName',
      text: 'First Name',
      sort: true,
      headerSortingStyle,
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
        width: '12%'
      }
    }, {
      dataField: 'lastName',
      text: 'Last Name',
      sort: true,
      headerSortingStyle,
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
        width: '12%'
      }
    }, {
      dataField: 'sex',
      text: 'Sex',
      sort: true,
      headerSortingStyle,
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
        width: '10%'
      }
    }, {
      dataField: 'birthday',
      text: 'DOB',
      sort: true,
      headerSortingStyle,
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
        width: '15%'
      }
    }, {
      dataField: 'patientStatus',
      text: 'Status',
      sort: true,
      headerSortingStyle,
      headerStyle: {
        backgroundColor: Colors.searchTintColor,
        width: '10%'
      }
    }, {
      dataField: 'action',
      text: 'Actions',
      headerStyle: {
        backgroundColor: Colors.searchTintColor
      },
      formatter: actionButtonFormatter
    }];

    function actionButtonFormatter(cell, row, rowIndex) {
      return (
        <div className="container" key={rowIndex}>
          <button className="button column-button" onClick={() => that.goEdit(row._id)}>Edit</button>
          <button className="button is-primary column-checkin-button" onClick={() => that.goAdmit(row._id, row)}>{row.admitted ? 'Discharge' : 'Admit'}</button>
          <button className="button is-danger column-button" onClick={() => that.showDeleteModal(row)}>Delete</button>
        </div>
      );
    }

    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Patient Listing
          </span>
          <div className="view-action-buttons">
            <Link to="/patients/edit/new">
              + New Patient
            </Link>
          </div>
        </div>
        <div className="detail">
          {patients.length === 0 ?
            <div className="notification">
              <span>
                No patients found. <Link to="/patients/edit/new">Create a new patient record?</Link>
              </span>
            </div>
            :
            <div>
              <BootstrapTable
                keyField="_id"
                data={patients}
                columns={patientColumns}
                defaultSortDirection="asc"
              />
            </div>
          }
        </div>
        <DeletePatientModal
          isVisible={deleteModalVisible}
          onClose={this.onCloseModal}
          onDelete={this.onDeletePatient}
          little
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { patients, deletePatientSuccess } = state.patients;
  return {
    patients,
    deletePatientSuccess
  };
}

const mapDispatchToProps = dispatch => ({
  fetchPatients: () => dispatch(fetchPatients()),
  deletePatient: (selectedPatient) => dispatch(deletePatient(selectedPatient)),
});

export default connect(mapStateToProps, mapDispatchToProps)(PatientListing);
