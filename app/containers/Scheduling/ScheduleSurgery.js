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
            Theater Schedule
          </span>
          <div className="view-action-buttons">
            <button>
              + schedule surgery
            </button>
          </div>
        </div>
      </div>
    );
  }
}
