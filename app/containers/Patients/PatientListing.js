import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchPatients } from '../../actions/patients';

const headerSortingStyle = { backgroundColor: '#c8e6c9' };

const columns = [{
  dataField: 'id',
  text: 'id',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: 'rgba(38, 54, 72, 0.3)'
  },
}, {
  dataField: 'firstName',
  text: 'First Name',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: 'rgba(38, 54, 72, 0.3)'
  }
}, {
  dataField: 'lastName',
  text: 'Last Name',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: 'rgba(38, 54, 72, 0.3)'
  }
}, {
  dataField: 'sex',
  text: 'Sex',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: 'rgba(38, 54, 72, 0.3)'
  }
}, {
  dataField: 'birthday',
  text: 'DOB',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: 'rgba(38, 54, 72, 0.3)'
  }
}, {
  dataField: 'patientStatus',
  text: 'Status',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: 'rgba(38, 54, 72, 0.3)'
  }
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: 'rgba(38, 54, 72, 0.3)'
  }
}];

class PatientListing extends Component {
  componentDidMount() {
    this.props.fetchPatients();
  }

  render() {
    const { patients } = this.props;
    console.log('patients', patients);
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
                keyField="id"
                data={patients}
                columns={columns}
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
