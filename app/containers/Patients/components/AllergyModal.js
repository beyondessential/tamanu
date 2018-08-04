import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import moment from 'moment';
import { pick } from 'lodash';
import InputGroup from '../../../components/InputGroup';
import { AllergyModel } from '../../../models';

class AllergyModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formValid: false,
      isVisible: false,
      form: {},
      item: {},
    };

    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.resetForm = this.resetForm.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { action, itemId, model: Model } = nextProps;
    if (action === 'edit') {
      const item = Model.get('allergies').findWhere({ _id: itemId });
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
    const { action, model: Model } = this.props;
    const { item, form } = this.state;

    try {
      if (action === 'new') {
        const allergy = new AllergyModel(form);
        const model = await allergy.save();
        Model.get('allergies').add(model.attributes);
        await Model.save();
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
    const { itemId: _id, model: Model } = this.props;
    const { item } = this.state;
    try {
      Model.get('allergies').remove({ _id });
      await Model.save();
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
              <h2>{action === 'new' ? 'Add' : 'Update'} Allergy</h2>
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

export default AllergyModal;
