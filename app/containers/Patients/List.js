// @flow
import React, { Component } from 'react';

type Props = {};

export default class PatientsList extends Component<Props> {
  props: Props;

  render() {
    console.log('PatientsList rendered ==========');
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
      </div>
    );
  }
}
