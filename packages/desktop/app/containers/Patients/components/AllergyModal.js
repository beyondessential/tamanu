import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import { pick } from 'lodash';
import {
  InputGroup, AddButton, DeleteButton, UpdateButton,
} from '../../../components';
import { AllergyModel } from '../../../models';

class AllergyModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formValid: false,
      form: {},
      item: {},
    };

    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.resetForm = this.resetForm.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { action, itemId, patientModel } = nextProps;
    if (action === 'edit') {
      const item = patientModel.get('allergies').findWhere({ _id: itemId });
      if (item) {
        const form = pick(item.attributes, ['name']);
        this.setState({ form, item }, () => this.validateField('name'));
      }
    } else {
      this.resetForm();
    }
  }

  resetForm() {
    const form = { name: '' };
    this.setState({ form });
  }

  handleUserInput = (e) => {
    const { form } = this.state;
    const { name } = e.target;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    form[name] = value;
    this.setState({ form }, () => { this.validateField(name); });
  }

  validateField(name) {
    let valid = true;
    if (this.state.form[name] === '') valid = false;
    this.setState({ formValid: valid });
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { action, patientModel } = this.props;
    const { item, form } = this.state;

    try {
      if (action === 'new') {
        const allergy = new AllergyModel(form);
        await allergy.save();
        patientModel.get('allergies').add(allergy);
        await patientModel.save();
      } else {
        item.set(form);
        await item.save();
      }

      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  async deleteItem() {
    const { itemId: _id, patientModel } = this.props;
    const { item } = this.state;
    try {
      patientModel.get('allergies').remove({ _id });
      await patientModel.save();
      await item.destroy();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const { onClose, action, isVisible } = this.props;
    const { form } = this.state;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <form
          name="allergyForm"
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="tamanu-error-modal">
            <div className="modal-header">
              <h2>
                {action === 'new' ? 'Add' : 'Update'}
                {' '}
Allergy
              </h2>
            </div>
            <div className="modal-content">
              <InputGroup
                name="name"
                label="Name"
                value={form.name}
                onChange={this.handleUserInput}
                autoFocus
                required
              />
            </div>
            <div className="modal-footer">
              <div className="column has-text-right">
                {action !== 'new'
                  && (
                  <DeleteButton
                    can={{ do: 'delete', on: 'allergy' }}
                    onClick={this.deleteItem}
                  />
                  )}
                {action !== 'new'
                  && (
                  <UpdateButton
                    can={{ do: 'update', on: 'allergy' }}
                    type="submit"
                    disabled={!this.state.formValid}
                  />
                  )}
                {action === 'new'
                  && (
                  <AddButton
                    can={{ do: 'create', on: 'allergy' }}
                    type="submit"
                    disabled={!this.state.formValid}
                  />
                  )}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}

export default AllergyModal;
