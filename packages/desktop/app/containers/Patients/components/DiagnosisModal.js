import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import moment from 'moment';
import styled from 'styled-components';
import { InputGroup, AddButton, CancelButton,
          DeleteButton, UpdateButton, CheckboxGroup, SelectGroup,
          DatepickerGroup, Button, Modal as ConditionConfirmModal } from '../../../components';
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
    this.state = {
      conditionModalVisible: false
    };
    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  }

  handleUserInput = (e, field) => {
    const { model: Model } = this.props;
    let fieldName = field;
    let fieldValue = '';

    if (e instanceof moment || typeof e.target === "undefined") {
      fieldValue = e;
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      fieldName = name;
      fieldValue = value;
    }

    Model.set({ [fieldName]: fieldValue });
    this.forceUpdate(); // re-render
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { action, model: Model, visitModel } = this.props;

    try {
      await Model.save();
      if (action === 'new') {
        visitModel.get('diagnoses').add(Model);
        await visitModel.save();
      } else {
        visitModel.trigger('change');
      }

      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  async deleteItem() {
    const { itemId: _id, model: Model, visitModel } = this.props;
    try {
      visitModel.get('diagnoses').remove({ _id });
      await visitModel.save();
      await Model.destroy();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  async makeOngoingCondition() {
    const { model, patientModel } = this.props;
    this.conditionModalClose();
    if (model.id) {
      const { date, diagnosis: condition } = model.toJSON();
      const conditionModel = new ConditionModel({ date, condition });
      await conditionModel.save();
      // attach to patient
      patientModel.get('conditions').add(conditionModel);
      await patientModel.save();
      // link to current diagnosis object
      model.set({ 'condition': conditionModel });
      await model.save();
      notifySuccess('Diagnosis was marked as an ongoing condition successfully.');
      this.forceUpdate(); // re-render
    } else {
      notifyError('Invalid request');
    }
  }

  conditionModalOpen() {
    this.setState({ conditionModalVisible: true });
  }

  conditionModalClose() {
    this.setState({ conditionModalVisible: false });
  }

  render() {
    const { conditionModalVisible } = this.state;
    const {
      onClose,
      action,
      model: Model
    } = this.props;
    const { attributes: form } = Model;

    return (
      <React.Fragment>
        <Modal open={this.props.isVisible} onClose={onClose} little>
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
                  value={form.diagnosis}
                  onChange={this.handleUserInput}
                  autoFocus
                  required
                />
                <div className="columns p-l-15 p-r-15">
                  <DatepickerGroup
                    className="column is-half"
                    label="Date"
                    name="date"
                    value={form.date}
                    onChange={this.handleUserInput} />
                  <SelectGroup
                    className="column is-half"
                    label="Certainty"
                    name="certainty"
                    options={diagnosisCertainty}
                    value={form.certainty}
                    onChange={this.handleUserInput} />
                </div>
                <CheckboxGroupNoPadding
                  className="column"
                  checked={form.secondaryDiagnosis}
                  label="Secondary Diagnosis"
                  name="secondaryDiagnosis"
                  onChange={this.handleUserInput} />
                <CheckboxGroupNoPadding
                  className="column"
                  checked={form.active}
                  label="Active Diagnosis"
                  name="active"
                  onChange={this.handleUserInput}
                />
                <div className="is-clearfix" />
              </div>
              <div className="modal-footer">
                <div className="column has-text-right">
                  {action !== 'new' &&
                    <React.Fragment>
                      <Button
                        className="is-pulled-left"
                        color="secondary"
                        variant="contained"
                        onClick={this.conditionModalOpen.bind(this)}
                        disabled={Model.hasOngoingCondition()}
                        can={{ do: 'create', on: 'condition' }}
                      >Make Ongoing Condition</Button>
                      <DeleteButton
                        can={{ do: 'delete', on: 'diagnosis' }}
                        disabled={Model.hasOngoingCondition()}
                        onClick={this.deleteItem} />
                      <UpdateButton
                        can={{ do: 'update', on: 'diagnosis' }}
                        type="submit"
                        disabled={!Model.isValid()} />
                    </React.Fragment>}
                  {action === 'new' &&
                    <React.Fragment>
                      <CancelButton
                        onClick={onClose} />
                      <AddButton
                        can={{ do: 'create', on: 'diagnosis' }}
                        type="submit"
                        disabled={!Model.isValid()} />
                    </React.Fragment>}
                </div>
              </div>
            </div>
          </form>
        </Modal>

        <ConditionConfirmModal
          modalType="confirm"
          headerTitle="Mark as ongoing condition?"
          contentText="Are you sure you want to mark this diagnosis as an ongoing condition?"
          isVisible={conditionModalVisible}
          onConfirm={this.makeOngoingCondition.bind(this)}
          onClose={this.conditionModalClose.bind(this)}
        />
      </React.Fragment>
    );
  }
}

export default DiagnosisModal;
