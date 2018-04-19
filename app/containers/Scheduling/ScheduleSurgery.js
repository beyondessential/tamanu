// @flow
import React, { Component } from 'react';

type Props = {};

export default class ScheduleSurgery extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            New Surgical Appointment
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
