import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { InputGroup, AddButton, CancelButton,
          DeleteButton, UpdateButton, CheckboxGroup, SelectGroup,
          DatepickerGroup, Modal as ConditionConfirmModal } from '../../../components';
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
    const { diagnosisModel: { attributes } } = this.props;
    this.state = { ...attributes, formIsValid: false };
    this.submitForm = this.submitForm.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  }

  componentWillReceiveProps(newProps) {
    const { attributes } = newProps.diagnosisModel;
    const formIsValid = newProps.diagnosisModel.isValid();
    this.setState({ ...attributes, formIsValid });
    // handle diagnosisModel's change
    newProps.diagnosisModel.off('change');
    newProps.diagnosisModel.on('change', this.handleChange);
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
    const { diagnosisModel } = this.props;
    diagnosisModel.set({ [fieldName]: fieldValue });
  }

  handleChange() {
    const { diagnosisModel } = this.props;
    const formIsValid = diagnosisModel.isValid();
    const changedAttributes = diagnosisModel.changedAttributes();
    this.setState({ ...changedAttributes, formIsValid });
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { action, diagnosisModel, parentModel } = this.props;

    try {
      await diagnosisModel.save();
      if (action === 'new') {
        parentModel.get('diagnoses').add(diagnosisModel);
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
    const { itemId: _id, diagnosisModel, parentModel } = this.props;
    try {
      parentModel.get('diagnoses').remove({ _id });
      await parentModel.save();
      await diagnosisModel.destroy();
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
    const { isConditionModalVisible } = this.state;
    const {
      onClose,
      action,
    } = this.props;
    const {
      diagnosis,
      date,
      certainty,
      secondaryDiagnosis,
      active,
      formIsValid
    } = this.state;

    return (
      <React.Fragment>
        <Modal
          classNames={{ modal: 'tamanu-modal' }}
          open={this.props.isVisible}
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
                <InputGroup
                  className="field column m-b-10"
                  name="diagnosis"
                  label="Diagnosis"
                  value={diagnosis}
                  onChange={this.handleFormInput}
                  autoFocus
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
  diagnosisModel: PropTypes.object.isRequired,
};

export default DiagnosisModal;
