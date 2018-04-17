// @flow
import React, { Component } from 'react';
import Sidebar from '../components/Sidebar';

type Props = {};

export default class Patients extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <Sidebar />
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
      </div>
    );
  }
}
