// @flow
import React, { Component } from 'react';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <div className="sidebar">
          <div className="header">
            <span>
              Tamanu
            </span>
          </div>
          <div className="scroll-container">
            <div className="item">
              <span>
                Inventory
              </span>
            </div>
            <div className="item">
              <span>
                Patients
              </span>
            </div>
            <div className="item">
              <span>
                Scheduling
              </span>
            </div>
            <div className="item">
              <span>
                Imaging
              </span>
            </div>
            <div className="item">
              <span>
                Medication
              </span>
            </div>
            <div className="item">
              <span>
                Labs
              </span>
            </div>
            <div className="item">
              <span>
                Billing
              </span>
            </div>
            <div className="item">
              <span>
                Incident
              </span>
            </div>
            <div className="item">
              <span>
                Administration
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
