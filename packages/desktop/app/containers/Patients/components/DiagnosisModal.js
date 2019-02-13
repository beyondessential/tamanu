import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import moment from 'moment';
import styled from 'styled-components';
import { InputGroup, AddButton, CancelButton,
          DeleteButton, UpdateButton, CheckboxGroup,
          DatepickerGroup } from '../../../components';

const CheckboxGroupNoPadding = styled(CheckboxGroup)`
  padding-top: 0 !important;
  padding-bottom: 0 !important;
`;

class DiagnosisModal extends Component {
  constructor(props) {
    super(props);
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
    const { action, model: Model, parentModel } = this.props;

    try {
      await Model.save();
      if (action === 'new') {
        parentModel.get('diagnoses').add(Model);
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
    const { itemId: _id, model: Model, parentModel } = this.props;
    try {
      parentModel.get('diagnoses').remove({ _id });
      await parentModel.save();
      await Model.destroy();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const {
      onClose,
      action,
      model: Model
    } = this.props;
    const { attributes: form } = Model;

    return (
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
              <DatepickerGroup
                className="column is-half"
                label="Date"
                name="date"
                value={form.date}
                onChange={this.handleUserInput} />
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
                <CancelButton
                  onClick={onClose} />
                {action !== 'new' &&
                  <React.Fragment>
                    <DeleteButton
                      can={{ do: 'delete', on: 'diagnosis' }}
                      onClick={this.deleteItem} />
                    <UpdateButton
                      can={{ do: 'update', on: 'diagnosis' }}
                      type="submit"
                      disabled={!Model.isValid()} />
                  </React.Fragment>}
                {action === 'new' &&
                  <AddButton
                    can={{ do: 'create', on: 'diagnosis' }}
                    type="submit"
                    disabled={!Model.isValid()} />}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}

export default DiagnosisModal;
