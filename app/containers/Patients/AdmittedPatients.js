import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchAdmittedPatients } from '../../actions/patients';
import { patientColumns } from '../../constants';

class AdmittedPatients extends Component {
  componentDidMount() {
    this.props.fetchAdmittedPatients();
  }

  render() {
    const { admittedPatients } = this.props;
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
