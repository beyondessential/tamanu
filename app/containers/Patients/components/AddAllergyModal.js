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

  submitForm = async (e) => {
    e.preventDefault();
    const { patient, model: patientModel } = this.props;
    const _this = this;
    const allergy = Serializer.serialize(e.target, { hash: true });

    const _allergy = new AllergyModel(allergy);
    try {
      const model = await _allergy.save();
      patientModel.get('allergies').add({ _id: model.id });
      await patientModel.save();
      _this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
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
