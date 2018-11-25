import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import { PatientContact } from '../../../models';
import { InputGroup } from '../../../components';


class ContactModal extends Component {
  constructor(props) {
    super(props);
    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
  }

  state = {
    action: 'new',
    isVisible: false,
    Model: new PatientContact(),
  };

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { itemId, isVisible, patientModel } = props;
    const action = itemId ? 'edit' : 'new';
    let Model;
    if (action === 'edit') {
      Model = patientModel.get('additionalContacts').findWhere({ _id: itemId });
    } else {
      Model = new PatientContact();
    }
    this.setState({ action, isVisible, Model });
  }

  handleUserInput = (e, field) => {
    const { Model } = this.state;
    if (typeof field !== 'undefined') {
      Model.set(field, e, { silent: true });
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      Model.set(name, value, { silent: true });
    }
    this.setState({ Model });
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { action, patientModel } = this.props;
    const { Model } = this.state;

    try {
      await Model.save();
      if (action === 'new') {
        patientModel.get('additionalContacts').add(Model);
        await patientModel.save(null, { silent: true });
      } else {
        patientModel.trigger('change');
      }
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const { onClose } = this.props;
    const { action, isVisible, Model } = this.state;
    const { attributes: form } = Model;
    return (
      <Modal open={isVisible} onClose={onClose} little>
        <form
          id="contactForm"
          name="contactForm"
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="tamanu-error-modal">
            <div className="modal-header">
              <h2>Add Contact</h2>
            </div>
            <div className="modal-content">
              <InputGroup
                name="name"
                label="Name"
                onChange={this.handleUserInput}
                value={form.name}
                required
              />
              <InputGroup
                name="phone"
                label="Phone"
                onChange={this.handleUserInput}
                value={form.phone}
                required
              />
              <InputGroup
                type="email"
                name="email"
                label="Email"
                onChange={this.handleUserInput}
                value={form.email}
              />
              <InputGroup
                name="relationship"
                label="Relationship"
                onChange={this.handleUserInput}
                value={form.relationship}
              />
            </div>
            <div className="modal-footer">
              <div className="column has-text-right">
                <button className="button is-danger cancel" type="button" onClick={onClose}>Cancel</button>
                <button className="button is-primary" type="submit" form="contactForm" disabled={!Model.isValid()}>{action === 'new' ? 'Add' : 'Update'}</button>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}

ContactModal.propTypes = {
  patientModel: PropTypes.object.isRequired,
  itemId: PropTypes.string,
  isVisible: PropTypes.bool.isRequired,
  action: PropTypes.string,
};

ContactModal.defaultProps = {
  action: 'new',
  itemId: '',
};

export default ContactModal;
