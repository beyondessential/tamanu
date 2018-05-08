import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchPatients } from '../../actions/patients';
import { patientColumns } from '../../constants';

class Users extends Component {
  componentDidMount() {
    this.props.fetchPatients();
  }

  render() {
    const { patients } = this.props;
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            User Listing
          </span>
          <div className="view-action-buttons">
            <Link to="/admin/users/edit/new">
              + New User
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

export default connect(mapStateToProps, mapDispatchToProps)(Users);
