import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import { map, isEmpty } from 'lodash';

// import { fetchPatients, deletePatient } from '../../actions/patients';
import { Colors, headerSortingStyle } from '../../constants';
import DeletePatientModal from './components/DeletePatientModal';
import { PatientsCollection } from '../../collections';


class PatientListing extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    deleteModalVisible: false,
    selectedPatient: null,
  }

  componentDidMount() {
    this.props.collection.on('update', this.handleChange);
    this.props.collection.fetch();
  }

  componentWillReceiveProps({ deletePatientSuccess }) {
    if (deletePatientSuccess) {
      this.props.collection.fetch();
    }
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    this.forceUpdate();
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
    let { selectedPatient } = this.state;
    selectedPatient = this.props.collection.findWhere({ _id: selectedPatient._id });
    if (!isEmpty(selectedPatient)) {
      selectedPatient.destroy({
        wait: true,
        success: () => this.onCloseModal()
      });
    }
  }

  render() {
    const { deleteModalVisible } = this.state;
    const that = this;
    let { models: patients } = this.props.collection;
    if (patients.length > 0) patients = map(patients, patient => patient.attributes);

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

PatientListing.defaultProps = {
  collection: new PatientsCollection(),
  patients: []
};

export default PatientListing;

// function mapStateToProps(state) {
//   const { patients, deletePatientSuccess } = state.patients;
//   return {
//     patients,
//     deletePatientSuccess
//   };
// }

// const mapDispatchToProps = dispatch => ({
//   fetchPatients: () => dispatch(fetchPatients()),
//   deletePatient: (selectedPatient) => dispatch(deletePatient(selectedPatient)),
// });

// export default connect(mapStateToProps, mapDispatchToProps)(PatientListing);
