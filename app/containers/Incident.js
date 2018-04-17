// @flow
import React, { Component } from 'react';
import Sidebar from '../components/Sidebar';

type Props = {};

export default class Incident extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <Sidebar />
        <div className="content">
          <div className="view-top-bar">
            <span>
              Incidents
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
