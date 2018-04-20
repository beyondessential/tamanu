// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

type Props = {};

class PatientListing extends Component<Props> {
  props: Props;

  render() {
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
          <div className="notification">
            <span>
              No patients found. <Link to="/patients/edit/new">Create a new patient record?</Link>
            </span>
          </div>
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

export default connect(mapStateToProps, undefined)(PatientListing);
