import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchPatients } from '../../actions/patients';
import { Colors, headerSortingStyle } from '../../constants';

class PatientListing extends Component {
  componentDidMount() {
    this.props.fetchPatients();
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

  render() {
    const that = this;
    const { patients } = this.props;
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
          <button className="button is-danger column-button">Delete</button>
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
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    patients: state.patients.patients
  };
}

const mapDispatchToProps = dispatch => ({
  fetchPatients: () => dispatch(fetchPatients()),
});

export default connect(mapStateToProps, mapDispatchToProps)(PatientListing);
