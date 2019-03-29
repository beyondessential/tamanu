import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import {
  TextInput, AddButton, CancelButton,
  DeleteButton, UpdateButton, DateInput,
  Dialog as DeleteConfirmDialog, Modal, ModalActions,
} from '../../../components';
import { ConditionModel, PatientModel } from '../../../models';

export default class ConditionModal extends Component {
  static propTypes = {
    conditionModel: PropTypes.instanceOf(ConditionModel).isRequired,
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
    const { conditionModel: { attributes } } = this.props;
    this.state = {
      ...attributes,
      formIsValid: false,
      deleteModalVisible: false,
    };
  }

  componentWillReceiveProps(newProps) {
    const { attributes } = newProps.conditionModel;
    const formIsValid = newProps.conditionModel.isValid();
    this.setState({ ...attributes, formIsValid });
    // handle conditionModel's change
    newProps.conditionModel.off('change');
    newProps.conditionModel.on('change', this.handleChange);
  }

  handleFormInput = (event) => {
    const {
      name: fieldName, type, checked, value,
    } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    this.handleUserInput(fieldValue, fieldName);
  }

  handleUserInput = (fieldValue, fieldName) => {
    const { conditionModel } = this.props;
    conditionModel.set({ [fieldName]: fieldValue });
  }

  submitForm = async (event) => {
    event.preventDefault();
    const { action, conditionModel, patientModel } = this.props;

    try {
      await conditionModel.save();
      if (action === 'new') {
        patientModel.get('conditions').add(conditionModel);
        await patientModel.save();
      } else {
        patientModel.trigger('change');
      }

      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  deleteItem = async () => {
    const {
      itemId: _id,
      conditionModel,
      patientModel,
    } = this.props;

    try {
      this.deleteModalClose();
      patientModel.get('conditions').remove({ _id });
      await patientModel.save();
      await conditionModel.destroy();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  deleteModalClose = () => {
    this.setState({ deleteModalVisible: false });
  }

  handleChange = () => {
    const { conditionModel } = this.props;
    const formIsValid = conditionModel.isValid();
    const changedAttributes = conditionModel.changedAttributes();
    this.setState({ ...changedAttributes, formIsValid });
  }

  deleteItemConfirm = () => {
    this.setState({ deleteModalVisible: true });
  }

  render() {
    const {
      condition,
      date,
      deleteModalVisible,
      formIsValid,
    } = this.state;
    const {
      onClose,
      action,
      isVisible,
    } = this.props;

    return (
      <React.Fragment>
        <Modal
          title={`${action === 'new' ? 'Add' : 'Update'} Condition`}
          isVisible={isVisible}
          onClose={onClose}
        >
          <form
            name="conditionForm"
            onSubmit={this.submitForm}
          >
            <Grid container spacing={16} direction="row">
              <Grid container item>
                <TextInput
                  name="condition"
                  label="Condition"
                  value={condition}
                  onChange={this.handleFormInput}
                  autoFocus
                  required
                />
              </Grid>
              <Grid container item>
                <DateInput
                  label="Date of Diagnosis"
                  name="date"
                  value={date}
                  onChange={this.handleFormInput}
                  required
                />
              </Grid>
            </Grid>
            <ModalActions>
              {action !== 'new'
                && (
                <React.Fragment>
                  <DeleteButton
                    can={{ do: 'delete', on: 'condition' }}
                    onClick={this.deleteItemConfirm}
                  />
                  <UpdateButton
                    can={{ do: 'update', on: 'condition' }}
                    type="submit"
                    disabled={!formIsValid}
                  />
                </React.Fragment>
                )
              }
              {action === 'new'
                && (
                <React.Fragment>
                  <CancelButton onClick={onClose} />
                  <AddButton
                    can={{ do: 'create', on: 'condition' }}
                    type="submit"
                    disabled={!formIsValid}
                  />
                </React.Fragment>
                )
              }
            </ModalActions>
          </form>
        </Modal>

        <DeleteConfirmDialog
          dialogType="confirm"
          headerTitle="Delete Ongoing Condition?"
          contentText="Are you sure you want to delete this ongoing condition?"
          isVisible={deleteModalVisible}
          onConfirm={this.deleteItem}
          onClose={this.deleteModalClose}
        />
      </React.Fragment>
    );
  }
}
