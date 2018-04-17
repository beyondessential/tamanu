// @flow
import React, { Component } from 'react';
import Sidebar from '../components/Sidebar';

type Props = {};

export default class Scheduling extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <Sidebar />
        <div className="content">
          <div className="view-top-bar">
            <span>
              Appointments This Week
            </span>
            <div className="view-action-buttons">
              <button>
                + New Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
