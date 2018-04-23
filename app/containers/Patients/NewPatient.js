// @flow
import React, { Component } from 'react';
import InputGroup from '../../components/InputGroup';

type Props = {};

export default class NewPatient extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className="create-content">
        <div className="create-top-bar">
          <span>
            New Patient
          </span>
          <div className="view-action-buttons">
            <button>
              Admit Patient
            </button>
          </div>
        </div>
        <div className="create-container">
          <div className="columns form">
            <div className="column">
              <InputGroup
                label="First Name"
                required
              />
              <InputGroup
                label="Middel Name"
              />
              <InputGroup
                label="Last Name"
                required
              />
              <InputGroup
                label="Sex"
              />
              <InputGroup
                label="Date of Birth"
              />
              <InputGroup
                label="Age"
              />
              <InputGroup
                label="Place of Birth"
              />
              <InputGroup
                label="Occupation"
              />
              <InputGroup
                label="Patient Type"
              />
            </div>
            <div className="column">
              <InputGroup
                label="Patient Status"
              />
              <InputGroup
                label="External Patient Id"
              />
              <InputGroup
                label="Blood Type"
              />
              <InputGroup
                label="Clinic Site"
              />
              <InputGroup
                label="Referred By"
              />
              <InputGroup
                label="Referred Date"
              />
              <InputGroup
                label="Religion"
              />
              <InputGroup
                label="Parent/Guardian"
              />
              <InputGroup
                label="Payment Profile"
              />
              <div className="column has-text-right">
                <a className="button is-primary">+ Add Contact</a>
              </div>
            </div>
          </div>
          <div className="columns form">
            <div className="column">
              <InputGroup
                label="Phone"
              />
              <InputGroup
                label="Address"
              />
            </div>
            <div className="column">
              <InputGroup
                label="Email"
              />
              <InputGroup
                label="Country"
              />
              <div className="column has-text-right">
                <a className="button is-danger cancel">Cancel</a>
                <a className="button">Add</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
