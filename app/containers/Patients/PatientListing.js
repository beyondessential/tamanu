import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchPatients } from '../../actions/patients';

const columns = [{
  dataField: 'id',
  text: 'id'
}, {
  dataField: 'firstName',
  text: 'First Name'
}, {
  dataField: 'lastName',
  text: 'Last Name'
}, {
  dataField: 'sex',
  text: 'Sex'
}, {
  dataField: 'birthday',
  text: 'DOB'
}, {
  dataField: 'patientStatus',
  text: 'Status'
}, {
  dataField: 'action',
  text: 'Actions'
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
              <BootstrapTable keyField="id" data={patients} columns={columns} />
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
