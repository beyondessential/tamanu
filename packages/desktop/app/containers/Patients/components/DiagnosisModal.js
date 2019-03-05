import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { InputGroup, AddButton, CancelButton,
          DeleteButton, UpdateButton, CheckboxGroup, SelectGroup,
          DatepickerGroup, Modal as ConditionConfirmModal,
          DiagnosisAutocomplete } from '../../../components';
import { diagnosisCertainty } from '../../../constants';
import { ConditionModel } from '../../../models';
import { notifyError, notifySuccess } from '../../../utils';

const CheckboxGroupNoPadding = styled(CheckboxGroup)`
  padding-top: 0 !important;
  padding-bottom: 0 !important;
`;

class DiagnosisModal extends Component {
  constructor(props) {
    super(props);
    const { patientDiagnosisModel: { attributes } } = this.props;
    this.state = { ...attributes, formIsValid: false };
    this.submitForm = this.submitForm.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
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

  handleSelectInput = (fieldValue, fieldName) => {
    this.handleUserInput(fieldValue, fieldName);
  }

  handleDateInput = (date, fieldName) => {
    this.handleUserInput(date, fieldName);
  }

  handleFormInput = (event) => {
    const { name: fieldName, type, checked, value } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    this.handleUserInput(fieldValue, fieldName);
  }

  handleUserInput = (fieldValue, fieldName) => {
    const { patientDiagnosisModel } = this.props;
    patientDiagnosisModel.set({ [fieldName]: fieldValue });
  }

  handleChange() {
    const { patientDiagnosisModel } = this.props;
    const formIsValid = patientDiagnosisModel.isValid();
    const changedAttributes = patientDiagnosisModel.changedAttributes();
    this.setState({ ...changedAttributes, formIsValid });
  }

  submitForm = async (e) => {
    e.preventDefault();
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

  async deleteItem() {
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

  async makeOngoingCondition() {
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
      parentModel.set({ 'condition': conditionModel });
      await parentModel.save();
      notifySuccess('Diagnosis was marked as an ongoing condition successfully.');
      this.forceUpdate(); // re-render
    } else {
      notifyError('Invalid request');
    }
  }

  openConditionModal() {
    this.setState({ isConditionModalVisible: true });
  }

  closeConditionModal() {
    this.setState({ isConditionModalVisible: false });
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
      active,
      formIsValid,
      isConditionModalVisible,
    } = this.state;

    return (
      <React.Fragment>
        <Modal
          classNames={{ modal: 'tamanu-modal' }}
          open={isVisible}
          onClose={onClose}
          little
        >
          <form
            name="allergyForm"
            className="create-container"
            onSubmit={this.submitForm}
          >
            <div className="diagnosis-modal">
              <div className="modal-header">
                <h2>{action === 'new' ? 'Add' : 'Update'} Diagnosis</h2>
              </div>
              <div className="modal-content">
                <DiagnosisAutocomplete
                  label="Diagnosis"
                  name="diagnosis"
                  value={diagnosis}
                  onChange={this.handleAutocompleteInput}
                  required
                />
                <div className="columns p-l-15 p-r-15">
                  <DatepickerGroup
                    className="column is-half"
                    label="Date"
                    name="date"
                    value={date}
                    onChange={this.handleDateInput}
                  />
                  <SelectGroup
                    className="column is-half"
                    label="Certainty"
                    name="certainty"
                    options={diagnosisCertainty}
                    value={certainty}
                    onChange={this.handleSelectInput}
                  />
                </div>
                <CheckboxGroupNoPadding
                  className="column"
                  checked={secondaryDiagnosis}
                  label="Secondary Diagnosis"
                  name="secondaryDiagnosis"
                  onChange={this.handleFormInput}
                />
                <CheckboxGroupNoPadding
                  className="column"
                  checked={active}
                  label="Active Diagnosis"
                  name="active"
                  onChange={this.handleFormInput}
                />
                <div className="is-clearfix" />
              </div>
              <div className="modal-footer">
                <div className="column has-text-right">
                  <CancelButton onClick={onClose} />
                  {action !== 'new' &&
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
                  }
                  {action === 'new' &&
                    <AddButton
                      can={{ do: 'create', on: 'diagnosis' }}
                      type="submit"
                      disabled={!formIsValid}
                    />
                  }
                </div>
              </div>
            </div>
          </form>
        </Modal>
        <ConditionConfirmModal
          modalType="confirm"
          headerTitle="Mark as ongoing condition?"
          contentText="Are you sure you want to mark this diagnosis as an ongoing condition?"
          isVisible={isConditionModalVisible}
          onConfirm={this.makeOngoingCondition.bind(this)}
          onClose={this.closeConditionModal.bind(this)}
        />
      </React.Fragment>
    );
  }
}

DiagnosisModal.propTypes = {
  patientDiagnosisModel: PropTypes.object.isRequired,
};

export default DiagnosisModal;
