import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { pick } from 'lodash';
import {
  TextInput, AddButton, DeleteButton, UpdateButton,
  Modal, ModalActions, Dialog as DeleteConfirmDialog, ButtonGroup,
} from '../../../components';
import { AllergyModel, PatientModel } from '../../../models';

export default class AllergyModal extends Component {
  static propTypes = {
    patientModel: PropTypes.instanceOf(PatientModel).isRequired,
    action: PropTypes.string,
    onClose: PropTypes.func,
    isVisible: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    action: 'new',
    onClose: () => {},
  }

  constructor(props) {
    super(props);
    this.state = {
      formValid: false,
      form: {},
      item: {},
      deleteModalVisible: false,
    };
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

  handleUserInput = (e) => {
    const { form } = this.state;
    const { name } = e.target;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    form[name] = value;
    this.setState({ form }, () => { this.validateField(name); });
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

  deleteItem = async () => {
    const { itemId: _id, patientModel } = this.props;
    const { item } = this.state;
    try {
      patientModel.get('allergies').remove({ _id });
      await patientModel.save();
      await item.destroy();
      this.deleteModalClose();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  resetForm = () => {
    const form = { name: '' };
    this.setState({ form });
  }

  deleteModalClose = () => {
    this.setState({ deleteModalVisible: false });
  }

  deleteItemConfirm = () => {
    this.setState({ deleteModalVisible: true });
  }

  validateField(name) {
    let valid = true;
    if (this.state.form[name] === '') valid = false;
    this.setState({ formValid: valid });
  }

  render() {
    const { onClose, action, isVisible } = this.props;
    const { form, deleteModalVisible } = this.state;
    return (
      <React.Fragment>
        <Modal
          title={`${action === 'new' ? 'Add' : 'Update'} Allergy`}
          isVisible={isVisible}
          onClose={onClose}
        >
          <form
            name="allergyForm"
            className="create-container"
            onSubmit={this.submitForm}
          >
            <TextInput
              name="name"
              label="Name"
              value={form.name}
              onChange={this.handleUserInput}
              autoFocus
              required
            />
            <ModalActions>
              {action !== 'new'
                && (
                <React.Fragment>
                  <DeleteButton
                    can={{ do: 'delete', on: 'allergy' }}
                    onClick={this.deleteItemConfirm}
                  />
                  <UpdateButton
                    can={{ do: 'update', on: 'allergy' }}
                    type="submit"
                    disabled={!this.state.formValid}
                  />
                </React.Fragment>
                )}
              {action === 'new'
                && (
                <AddButton
                  can={{ do: 'create', on: 'allergy' }}
                  type="submit"
                  disabled={!this.state.formValid}
                />
                )}
            </ModalActions>
          </form>
        </Modal>
        <DeleteConfirmDialog
          dialogType="confirm"
          headerTitle="Delete Allergy?"
          contentText="Are you sure you want to delete this allergy?"
          isVisible={deleteModalVisible}
          onConfirm={this.deleteItem}
          onClose={this.deleteModalClose}
        />
      </React.Fragment>
    );
  }
}
