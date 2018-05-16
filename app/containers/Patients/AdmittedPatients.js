import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchAdmittedPatients } from '../../actions/patients';
import { headerSortingStyle, Colors } from '../../constants';

class AdmittedPatients extends Component {
  componentDidMount() {
    this.props.fetchAdmittedPatients();
  }

  goEditPatient = (patientId) => {
    this.props.history.push(`/patients/editPatient/${patientId}`);
  }

  goEdit = (patientId) => {
    this.props.history.push(`/patients/editvisit/${patientId}`);
  }

  render() {
    const { admittedPatients } = this.props;
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
          <button className="button column-button" onClick={() => that.goEditPatient(row._id)}>Edit</button>
          <button className="button is-primary column-checkin-button" onClick={() => that.goEdit(row._id)}>{row.admitted ? 'Discharge' : 'Admit'}</button>
          <button className="button is-danger column-button">Delete</button>
        </div>
      );
    }

    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Admitted Patients
          </span>
          <div className="view-action-buttons">
            <Link to="/patients/edit/new">
              + New Patient
            </Link>
          </div>
        </div>
        <div className="detail">
          {admittedPatients.length === 0 ?
            <div className="notification">
              <span>
                No patients found. <Link to="/patients/edit/new">Create a new patient record?</Link>
              </span>
            </div>
            :
            <div>
              <BootstrapTable
                keyField="_id"
                data={admittedPatients}
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
  const { admittedPatients } = state.patients;
  return {
    admittedPatients
  };
}

const mapDispatchToProps = dispatch => ({
  fetchAdmittedPatients: () => dispatch(fetchAdmittedPatients()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AdmittedPatients);
