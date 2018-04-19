// @flow
import React, { Component } from 'react';

type Props = {};

export default class NewIncident extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              New Incident
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
