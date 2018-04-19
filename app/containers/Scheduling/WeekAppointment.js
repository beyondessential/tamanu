// @flow
import React, { Component } from 'react';

type Props = {};

export default class WeekAppointment extends Component<Props> {
  props: Props;

  render() {
    return (
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
    );
  }
}
