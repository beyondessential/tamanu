// @flow
import React, { Component } from 'react';

type Props = {};

export default class AdmittedPatients extends Component<Props> {
  props: Props;

  render() {
    console.log(this.props);
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Admitted Patients
          </span>
          <div className="view-action-buttons">
            <button>
              + New Patient
            </button>
          </div>
        </div>
      </div>
    );
  }
}
