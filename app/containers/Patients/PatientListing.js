// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';

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
            <button>
              + New Patient
            </button>
          </div>
        </div>
        <div className="detail">
          <div className="notification">
            <span>
              No patients found. Create a new patient record?
            </span>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    patients: state.router.location.pathname
  };
}

export default connect(mapStateToProps, undefined)(PatientListing);
