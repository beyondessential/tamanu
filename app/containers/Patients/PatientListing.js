import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, isEmpty } from 'lodash';
import ReactTable from 'react-table';

// import { fetchPatients, deletePatient } from '../../actions/patients';
import { Colors, pageSizes } from '../../constants';
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
    pageSize: pageSizes.patients
  }

  componentDidMount() {
    this.props.collection.on('update', this.handleChange);
    this.props.collection.setPageSize(this.state.pageSize);
    this.props.collection.fetchByView();
  }

  componentWillReceiveProps({ deletePatientSuccess }) {
    if (deletePatientSuccess) {
      this.props.collection.fetchByView();
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

  onFetchData = (state) => {
    this.props.collection.setPage(state.page);
    this.props.collection.setPageSize(state.pageSize);

    this.setState({ loading: true });
    this.props.collection.fetchByView({
      success: () => {
        this.setState({ loading: false });
      }
    });
  }

  render() {
    const { deleteModalVisible } = this.state;
    const that = this;
    let { models: patients } = this.props.collection;
    if (patients.length > 0) patients = map(patients, patient => patient.attributes);
    // console.log('patients', this.props.collection);
    const patientColumns = [{
      accessor: 'displayId',
      Header: 'Id',
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
      accessor: 'firstName',
      Header: 'First Name',
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
      accessor: 'lastName',
      Header: 'Last Name',
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
      accessor: 'sex',
      Header: 'Sex',
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
      accessor: 'birthday',
      Header: 'DOB',
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
      accessor: 'patientStatus',
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
      minWidth: 350,
      Cell: row => {
        return (
          <div key={row._id}>
            <button className="button column-button" onClick={() => that.goEdit(row.value._id)}>View Patient</button>
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
              <ReactTable
                manual
                keyField="_id"
                data={patients}
                pages={this.props.collection.totalPages}
                defaultPageSize={pageSizes.patients}
                loading={this.state.loading}
                columns={patientColumns}
                className="-striped"
                defaultSortDirection="asc"
                onFetchData={this.onFetchData}
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
