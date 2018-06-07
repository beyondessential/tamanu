import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import Backbone from 'backbone-associations';
import InputGroup from '../../../components/InputGroup';
import Serializer from '../../../utils/form-serialize';
import { AllergyModel } from '../../../models';

class AddAllergyModal extends Component {
  constructor(props) {
    super(props);
    this.state = { name: '', formValid: false, isVisible: false };
    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.validateField = this.validateField.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { isVisible, action, item } = nextProps;
    if (action === 'edit') {
      this.setState({ isVisible, name: item.name }, () => this.validateField('name'));
    } else {
      this.setState({ isVisible, name: '' });
    }
  }

  handleUserInput = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value }, () => { this.validateField(name, value); });
  }

  validateField = (name) => {
    let valid = true;
    if (this.state[name] === '') valid = false;
    this.setState({ formValid: valid });
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { action, item, model: patientModel } = this.props;
    const _this = this;
    const form = Serializer.serialize(e.target, { hash: true });

    try {
      const allergy = new AllergyModel((action !== 'new' ? item : form));
      if (action !== 'new') allergy.set(form);
      const model = await allergy.save();

      // Attached allergy to patient object
      if (action === 'new') {
        patientModel.get('allergies').add({ _id: model.id });
        await patientModel.save();
      } else {
        patientModel.trigger('change');
      }

      _this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  async deleteItem() {
    const { item, model: patientModel } = this.props;
    const allergy = new AllergyModel(item);

    try {
      patientModel.get('allergies').remove({ _id: allergy.id });
      await patientModel.save();
      await allergy.destroy();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const { onClose, action } = this.props;
    return (
      <Modal open={this.state.isVisible} onClose={onClose} little>
        <form
          name="allergyForm"
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="tamanu-error-modal">
            <div className="modal-header">
              <h2>{action === 'new' ? 'Add' : 'Update'} Allergy</h2>
            </div>
            <div className="modal-content">
              <InputGroup
                name="name"
                label="Name"
                value={this.state.name}
                onChange={this.handleUserInput}
                required
              />
            </div>
            <div className="modal-footer">
              <div className="column has-text-right">
                <button className={action !== 'new' ? 'button is-danger' : 'button is-danger is-hidden'} type="button" onClick={this.deleteItem}>Delete</button>
                <button className="button is-primary" type="submit" disabled={!this.state.formValid}>{action === 'new' ? 'Add' : 'Update'}</button>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}

export default AddAllergyModal;
