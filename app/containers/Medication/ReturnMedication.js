// @flow
import React, { Component } from 'react';

type Props = {};

export default class ReturnMedication extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Return Medication
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
