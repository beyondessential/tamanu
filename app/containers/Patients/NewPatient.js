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
              Patient Check In
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
              <div className="column">
                <span>
                  Date of Birth
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Age
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Place of Birth
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Occupation
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Patient Type
                </span>
                <input className="input is-primary" type="text" />
              </div>
            </div>
            <div className="column">
              <div className="column">
                <span>
                  Patient Status
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  External Patient Id
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Blood Type
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Clinic Site
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Referred By
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Referred Date
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Religion
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Parent/Guardian
                </span>
                <input className="input is-primary" type="text" />
              </div>
              <div className="column">
                <span>
                  Payment Profile
                </span>
                <input className="input is-primary" type="text" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
