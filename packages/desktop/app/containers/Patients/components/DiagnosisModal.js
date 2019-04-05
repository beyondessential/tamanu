import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  AddButton, CancelButton, DiagnosisAutocomplete,
  DeleteButton, UpdateButton, CheckInput, SelectInput,
  DateInput, Dialog as ConditionConfirmDialog, FormRow,
  ModalActions, Modal,
} from '../../../components';
import { diagnosisCertainty } from '../../../constants';
import { ConditionModel } from '../../../models';
import { notifyError, notifySuccess } from '../../../utils';

export default class DiagnosisModal extends Component {
  constructor(props) {
    super(props);
    const { patientDiagnosisModel: { attributes } } = this.props;
    this.state = {
      ...attributes,
      formIsValid: false,
      isConditionModalVisible: false,
    };
  }

  componentWillReceiveProps(newProps) {
    const { attributes } = newProps.patientDiagnosisModel;
    const formIsValid = newProps.patientDiagnosisModel.isValid();
    this.setState({ ...attributes, formIsValid });
    // handle patientDiagnosisModel's change
    newProps.patientDiagnosisModel.off('change');
    newProps.patientDiagnosisModel.on('change', this.handleChange);
  }

  handleAutocompleteInput = (suggestion) => {
    this.handleUserInput({ _id: suggestion._id }, 'diagnosis');
  }

  handleFormInput = (event) => {
    const { name, value } = event.target;
    this.handleUserInput(value, name);
  }

  handleUserInput = (fieldValue, fieldName) => {
    const { patientDiagnosisModel } = this.props;
    patientDiagnosisModel.set({ [fieldName]: fieldValue });
  }

  submitForm = async (event) => {
    event.preventDefault();
    const { action, patientDiagnosisModel, parentModel } = this.props;

    try {
      await patientDiagnosisModel.save();
      if (action === 'new') {
        parentModel.get('diagnoses').add(patientDiagnosisModel);
        await parentModel.save();
      } else {
        parentModel.trigger('change');
      }

      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  makeOngoingCondition = async () => {
    const { parentModel, patientModel } = this.props;
    this.closeConditionModal();
    if (parentModel.id) {
      const { date, diagnosis: condition } = parentModel.toJSON();
      const conditionModel = new ConditionModel({ date, condition });
      await conditionModel.save();
      // attach to patient
      patientModel.get('conditions').add(conditionModel);
      await patientModel.save();
      // link to current diagnosis object
      parentModel.set({ condition: conditionModel });
      await parentModel.save();
      notifySuccess('Diagnosis was marked as an ongoing condition successfully.');
      this.forceUpdate(); // re-render
    } else {
      notifyError('Invalid request');
    }
  }

  closeConditionModal = () => {
    this.setState({ isConditionModalVisible: false });
  }

  handleChange = () => {
    const { patientDiagnosisModel } = this.props;
    const formIsValid = patientDiagnosisModel.isValid();
    const changedAttributes = patientDiagnosisModel.changedAttributes();
    this.setState({ ...changedAttributes, formIsValid });
  }

  deleteItem = async () => {
    const { itemId: _id, patientDiagnosisModel, parentModel } = this.props;
    try {
      parentModel.get('diagnoses').remove({ _id });
      await parentModel.save();
      await patientDiagnosisModel.destroy();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  openConditionModal() {
    this.setState({ isConditionModalVisible: true });
  }

  render() {
    const {
      onClose,
      action,
      isVisible,
    } = this.props;
    const {
      diagnosis,
      date,
      certainty,
      secondaryDiagnosis,
      formIsValid,
      isConditionModalVisible,
    } = this.state;

    return (
      <React.Fragment>
        <Modal
          title={`${action === 'new' ? 'Add' : 'Update'} Diagnosis`}
          isVisible={isVisible}
          onClose={onClose}
        >
          <form
            name="allergyForm"
            onSubmit={this.submitForm}
          >
            <FormRow>
              <DiagnosisAutocomplete
                label="Diagnosis"
                name="diagnosis"
                value={diagnosis}
                onChange={this.handleAutocompleteInput}
                required
              />
            </FormRow>
            <FormRow>
              <DateInput
                label="Date"
                name="date"
                value={date}
                onChange={this.handleFormInput}
              />
              <SelectInput
                label="Certainty"
                name="certainty"
                options={diagnosisCertainty}
                value={certainty}
                onChange={this.handleFormInput}
              />
            </FormRow>
            <FormRow>
              <CheckInput
                label="Secondary Diagnosis"
                name="secondaryDiagnosis"
                value={secondaryDiagnosis}
                onChange={this.handleFormInput}
              />
            </FormRow>
            <ModalActions>
              <CancelButton onClick={onClose} />
              {action !== 'new'
                && (
                <React.Fragment>
                  <DeleteButton
                    can={{ do: 'delete', on: 'diagnosis' }}
                    onClick={this.deleteItem}
                  />
                  <UpdateButton
                    can={{ do: 'update', on: 'diagnosis' }}
                    type="submit"
                    disabled={!formIsValid}
                  />
                </React.Fragment>
                )
              }
              {action === 'new'
                && (
                <AddButton
                  can={{ do: 'create', on: 'diagnosis' }}
                  type="submit"
                  disabled={!formIsValid}
                />
                )
              }
            </ModalActions>
          </form>
        </Modal>
        <ConditionConfirmDialog
          dialogType="confirm"
          headerTitle="Mark as ongoing condition?"
          contentText="Are you sure you want to mark this diagnosis as an ongoing condition?"
          isVisible={isConditionModalVisible}
          onConfirm={this.makeOngoingCondition}
          onClose={this.closeConditionModal}
        />
      </React.Fragment>
    );
  }
}

DiagnosisModal.propTypes = {
  patientDiagnosisModel: PropTypes.object.isRequired,
};
