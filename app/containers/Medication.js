// @flow
import React, { Component } from 'react';
import Sidebar from '../components/Sidebar';

type Props = {};

export default class Medication extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <Sidebar />
        <div className="content">
          <div className="view-top-bar">
            <span>
              Medication Requests
            </span>
            <div className="view-action-buttons">
              <button>
                + New Request
              </button>
              <button>
                Dispense Medication
              </button>
              <button>
                Return Medication
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
