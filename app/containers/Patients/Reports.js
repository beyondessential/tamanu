// @flow
import React, { Component } from 'react';

type Props = {};

export default class Reports extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Patient Report
          </span>
          <div className="view-action-buttons">
            <button>
              Patient Check In
            </button>
          </div>
        </div>
      </div>
    );
  }
}
