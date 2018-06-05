import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import InputGroup from '../../../components/InputGroup';
import Serializer from '../../../utils/form-serialize';
import { AllergyModel } from '../../../models';

class AddAllergyModal extends Component {
  constructor(props) {
    super(props);
    this.state = { formValid: false, isVisible: false };
    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.validateField = this.validateField.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { isVisible } = nextProps;
    this.setState({ isVisible });
  }

  handleUserInput = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value }, () => { this.validateField(name, value); });
  }

  validateField = (name, value) => {
    let valid = true;

    switch (name) {
      default:
      case 'name':
        if (value === '') valid = false;
        break;
    }

    this.setState({ formValid: valid });
  }

  submitForm = (e) => {
    // TODO: move this to the model
    e.preventDefault();
    const { patient } = this.props;
    const allergy = Serializer.serialize(e.target, { hash: true });
    // allergy.patient = patient.id;

    const _allergy = new AllergyModel(allergy);
    // patient.get('allergies').add(_allergy);
    // console.log('allergies', patient, patient.get('allergies'));
    _allergy.save(null, {
      success: (model, response) => {
        console.log('allergy saved!');
        patient.get('allergies').add(_allergy.id);
        patient.save();
        console.log('allergies', patient.get('allergies'));
        this.setState({ isVisible: false });
      },
      error: (model, response) => {
        console.error('error', response);
      }
    });
  }

  render() {
    const { onClose } = this.props;
    return (
      <Modal open={this.state.isVisible} onClose={onClose} little>
        <form
          name="allergyForm"
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="tamanu-error-modal">
            <div className="modal-header">
              <h2>Add Allergy</h2>
            </div>
            <div className="modal-content">
              <InputGroup
                name="name"
                label="Name"
                onChange={this.handleUserInput}
                required
              />
            </div>
            <div className="modal-footer">
              <div className="column has-text-right">
                <button className="button is-primary" type="submit" disabled={!this.state.formValid}>Add</button>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}

export default AddAllergyModal;
