import React, { Component } from 'react';
import { connect } from 'react-redux';

import ModalView from '../../components/Modal';
import Serializer from '../../utils/form-serialize';
import InputGroup from '../../components/InputGroup';
import { createMedication } from '../../actions/medications';

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
              const medication = Serializer.serialize(e.target, { hash: true });
              if (medication.firstName && medication.lastName) {
                this.props.createMedication(medication);
              } else {
                this.setState({ formError: true });
              }
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
  createMedication: medication => dispatch(createMedication(medication)),
});

export default connect(undefined, mapDispatchToProps)(NewMedication);
