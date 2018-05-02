import React, { Component } from 'react';
import { connect } from 'react-redux';

import ModalView from '../../components/Modal';
import Serializer from '../../utils/form-serialize';
import InputGroup from '../../components/InputGroup';
import { createDispense } from '../../actions/medications';

class Dispense extends Component {
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
              const dispense = Serializer.serialize(e.target, { hash: true });
              if (dispense.patient && dispense.visit && dispense.medication && dispense.prescription) {
                this.props.createDispense(dispense);
              } else {
                this.setState({ formError: true });
              }
            }}
          >
            <div className="form">
              <div className="columns">
                <div className="column">
                  <InputGroup
                    name="patient"
                    label="Patient"
                    required
                  />
                </div>
                <div className="column">
                  <InputGroup
                    name="visit"
                    label="Visit"
                    required
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <InputGroup
                    name="medication"
                    label="Medication"
                    required
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <InputGroup
                    name="prescription"
                    label="Prescription"
                    required
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-5">
                  <InputGroup
                    name="date"
                    label="Prescription Date"
                    required
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-4">
                  <InputGroup
                    name="quantity"
                    label="Quantity Dispensed"
                    required
                  />
                </div>
                <div className="column is-4">
                  <InputGroup
                    name="refills"
                    label="Refills"
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-4">
                  <InputGroup
                    name="billTo"
                    label="Bill To"
                    required
                  />
                </div>
              </div>
              <div className="column has-text-right">
                <a className="button is-danger cancel">Cancel</a>
                <button className="button" type="submit">Add</button>
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
  createDispense: dispense => dispatch(createDispense(dispense)),
});

export default connect(undefined, mapDispatchToProps)(Dispense);
