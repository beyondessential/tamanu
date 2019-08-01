import React, { Component } from 'react';

import InputGroup from '../../components/InputGroup';

export default class PrintHeader extends Component {
  render() {
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>Header Options</span>
        </div>
        <div className="create-container">
          <div className="form">
            <div className="columns">
              <div className="column">
                <InputGroup name="facilityName" label="Facility Name" />
                <InputGroup name="headerLine1" label="Header Line 1" />
                <InputGroup name="headerLine2" label="Header Line 2" />
                <InputGroup name="headerLine3" label="Header Line 3" />
                <InputGroup name="logoUrl" label="Logo URL" />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column">
                  <div className="has-text-right">
                    <button className="button is-primary" type="submit">
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
