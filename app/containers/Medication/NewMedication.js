import React, { Component } from 'react';
import { connect } from 'react-redux';

import ModalView from '../../components/Modal';
// import Serializer from '../../utils/form-serialize';
import InputGroup from '../../components/InputGroup';
import { createPatient } from '../../actions/patients';

class NewMedication extends Component {
  state = {
    formError: false,
  }
  onCloseModal = () => {
    this.setState({ formError: false });
  }

  render() {
    const { formError } = this.state;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              New Medication Request
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
          <form
            className="create-container"
            onSubmit={(e) => {
              e.preventDefault();
              // const patient = Serializer.serialize(e.target, { hash: true });
              // if (patient.firstName && patient.lastName) {
              //   this.props.createPatient(patient);
              // } else {
              //   this.setState({ formError: true });
              // }
            }}
          >
            <div className="columns form">
              <div className="column">
                <InputGroup
                  name="firstName"
                  label="First Name"
                  required
                />
              </div>
            </div>
          </form>
        </div>
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

export default connect(undefined, mapDispatchToProps)(NewMedication);
