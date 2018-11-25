import React, { Component } from 'react';

import InputGroup from '../../components/InputGroup';

class AddressFields extends Component {
  render() {
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            Address Options
          </span>
        </div>
        <div className="create-container">
          <div className="form">
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="address1"
                  label="Address 1 Label"
                />
                <InputGroup
                  name="address2"
                  label="Address 2 Label"
                />
                <InputGroup
                  name="address3"
                  label="Address 3 Label"
                />
                <InputGroup
                  name="address4"
                  label="Address 4 Label"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column">
                  <div className="has-text-right">
                    <button className="button is-primary" type="submit">Update</button>
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

export default AddressFields;
