import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { PatientContact } from '../../../models';
import {
  TextInput, Modal, ModalActions, CancelButton,
  AddButton, UpdateButton,
} from '../../../components';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';

export default class ContactModal extends Component {
  constructor(props) {
    super(props);
    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
  }

  state = {
    action: 'new',
    isVisible: false,
    contactModel: new PatientContact(),
  };

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleUserInput = (e, field) => {
    const { contactModel } = this.state;
    if (typeof field !== 'undefined') {
      contactModel.set(field, e, { silent: true });
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      contactModel.set(name, value, { silent: true });
    }
    this.setState({ contactModel });
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { action, patientModel } = this.props;
    const { contactModel } = this.state;

    try {
      await contactModel.save();
      if (action === 'new') {
        patientModel.get('additionalContacts').add(contactModel);
        await patientModel.save(null, { silent: true });
      } else {
        patientModel.trigger('change');
      }
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  handleChange(props = this.props) {
    const { itemId, isVisible, patientModel } = props;
    const action = itemId ? 'edit' : 'new';
    let contactModel;
    if (action === 'edit') {
      contactModel = patientModel.get('additionalContacts').findWhere({ _id: itemId });
    } else {
      contactModel = new PatientContact();
    }
    this.setState({ action, isVisible, contactModel });
  }

  render() {
    const { onClose } = this.props;
    const { action, isVisible, contactModel } = this.state;
    const { attributes: form } = contactModel;
    return (
      <Modal
        title="Add Contact"
        isVisible={isVisible}
        onClose={onClose}
      >
        <form
          id="contactForm"
          name="contactForm"
          className="create-container"
          onSubmit={this.submitForm}
        />
        <Grid container spacing={spacing * 2} direction="column">
          <Grid item>
            <TextInput
              name="name"
              label="Name"
              onChange={this.handleUserInput}
              value={form.name}
              required
            />
          </Grid>
          <Grid item>
            <TextInput
              name="phone"
              label="Phone"
              onChange={this.handleUserInput}
              value={form.phone}
              required
            />
          </Grid>
          <Grid item>
            <TextInput
              type="email"
              name="email"
              label="Email"
              onChange={this.handleUserInput}
              value={form.email}
            />
          </Grid>
          <Grid item>
            <TextInput
              name="relationship"
              label="Relationship"
              onChange={this.handleUserInput}
              value={form.relationship}
            />
          </Grid>
          <ModalActions>
            <CancelButton onClick={onClose} />
            {action === 'new'
              ? (
                <AddButton
                  can={{ do: 'create', on: 'condition' }}
                  type="submit"
                  form="contactForm"
                  disabled={!contactModel.isValid()}
                />
              )
              : (
                <UpdateButton
                  can={{ do: 'create', on: 'condition' }}
                  type="submit"
                  form="contactForm"
                  disabled={!contactModel.isValid()}
                />
              )
            }
          </ModalActions>
        </Grid>
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
