import React, { Component } from 'react';
import { connect } from 'react-redux';
import InputGroup from '../../components/InputGroup';
import Serializer from '../../utils/form-serialize';
import { createPatient } from '../../actions/patients';

class NewPatient extends Component<Props> {
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
        <form
          className="create-container"
          onSubmit={(e) => {
            e.preventDefault();
            this.props.createPatient(Serializer.serialize(e.target, { hash: true }));
          }}
        >
          <div className="columns form">
            <div className="column">
              <InputGroup
                name="firstName"
                label="First Name"
                required
              />
              <InputGroup
                name="middleName"
                label="Middel Name"
              />
              <InputGroup
                name="lastName"
                label="Last Name"
                required
              />
              <InputGroup
                name="sex"
                label="Sex"
              />
              <InputGroup
                name="birthday"
                label="Date of Birth"
              />
              <InputGroup
                name="age"
                label="Age"
              />
              <InputGroup
                name="placeOfBirth"
                label="Place of Birth"
              />
              <InputGroup
                name="occupation"
                label="Occupation"
              />
              <InputGroup
                name="patientType"
                label="Patient Type"
              />
            </div>
            <div className="column">
              <InputGroup
                name="patientStatus"
                label="Patient Status"
              />
              <InputGroup
                name="externalPatientId"
                label="External Patient Id"
              />
              <InputGroup
                name="bloodType"
                label="Blood Type"
              />
              <InputGroup
                name="clinicSite"
                label="Clinic Site"
              />
              <InputGroup
                name="referredBy"
                label="Referred By"
              />
              <InputGroup
                name="referredDate"
                label="Referred Date"
              />
              <InputGroup
                name="religion"
                label="Religion"
              />
              <InputGroup
                name="parent"
                label="Parent/Guardian"
              />
              <InputGroup
                name="paymentProfile"
                label="Payment Profile"
              />
              <div className="column has-text-right">
                <a className="button is-primary">+ Add Contact</a>
              </div>
            </div>
          </div>
          <div className="columns second-form">
            <div className="column">
              <InputGroup
                name="phone"
                label="Phone"
              />
              <InputGroup
                name="address"
                label="Address"
              />
            </div>
            <div className="column">
              <InputGroup
                name="email"
                label="Email"
              />
              <InputGroup
                name="country"
                label="Country"
              />
              <div className="column has-text-right">
                <a className="button is-danger cancel">Cancel</a>
                <button className="button" type="submit">Add</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  createPatient: patient => dispatch(createPatient(patient)),
});

export default connect(undefined, mapDispatchToProps)(NewPatient);
