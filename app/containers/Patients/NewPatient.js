import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import ModalView from '../../components/Modal';
import InputGroup from '../../components/InputGroup';
import Serializer from '../../utils/form-serialize';
import { createPatient } from '../../actions/patients';

class NewPatient extends Component {
  state = {
    formError: false,
  }
  onCloseModal = () => {
    this.setState({ formError: false });
  }

  render() {
    const { formError } = this.state;
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
            const patient = Serializer.serialize(e.target, { hash: true });
            if (patient.firstName && patient.lastName) {
              this.props.createPatient(patient);
            } else {
              this.setState({ formError: true });
            }
          }}
        >
          <div className="form">
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="firstName"
                  label="First Name"
                  required
                />
              </div>
              <div className="column">
                <InputGroup
                  name="patientStatus"
                  label="Patient Status"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="middleName"
                  label="Middel Name"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="externalPatientId"
                  label="External Patient Id"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="lastName"
                  label="Last Name"
                  required
                />
              </div>
              <div className="column">
                <InputGroup
                  name="bloodType"
                  label="Blood Type"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="culturalName"
                  label="Cultural or Traditional Name"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="clinicSite"
                  label="Clinic Site"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="sex"
                  label="Sex"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="referredBy"
                  label="Referred By"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="birthday"
                  label="Date of Birth"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="referredDate"
                  label="Referred Date"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="age"
                  label="Age"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="religion"
                  label="Religion"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="placeOfBirth"
                  label="Place of Birth"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="parent"
                  label="Parent/Guardian"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <InputGroup
                  name="occupation"
                  label="Occupation"
                />
              </div>
              <div className="column">
                <InputGroup
                  name="paymentProfile"
                  label="Payment Profile"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column is-6">
                <InputGroup
                  name="patientType"
                  label="Patient Type"
                />
              </div>
            </div>
            <div className="columns">
              <div className="column">
                <div className="column has-text-right">
                  <a className="button is-primary">+ Add Contact</a>
                </div>
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
                <Link className="button is-danger cancel" to="/patients">Cancel</Link>
                <button className="button" type="submit">Add</button>
              </div>
            </div>
          </div>
        </form>
        <ModalView
          isVisible={formError}
          onClose={this.onCloseModal}
          headerTitle="Warning!!!!"
          contentText="Please fill in required fields (marked with *) and correct the errors before saving."
          little
        />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  createPatient: patient => dispatch(createPatient(patient)),
});

export default connect(undefined, mapDispatchToProps)(NewPatient);
