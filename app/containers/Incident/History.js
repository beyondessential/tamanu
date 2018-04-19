// @flow
import React, { Component } from 'react';

type Props = {};

export default class History extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Closed Incidents
            </span>
            <div className="view-action-buttons">
              <button>
                + New Incident
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
