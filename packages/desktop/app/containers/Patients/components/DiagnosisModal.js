import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import moment from 'moment';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { InputGroup, AddButton, CancelButton,
          DeleteButton, UpdateButton, CheckboxGroup, SelectGroup,
          DatepickerGroup } from '../../../components';
import { diagnosisCertainty } from '../../../constants';

const CheckboxGroupNoPadding = styled(CheckboxGroup)`
  padding-top: 0 !important;
  padding-bottom: 0 !important;
`;

class DiagnosisModal extends Component {
  constructor(props) {
    super(props);
    this.state = { ...this.props.model.attributes, formIsValid: false };
    this.submitForm = this.submitForm.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  }

  componentWillReceiveProps(newProps) {
    const { attributes } = newProps.model;
    const formIsValid = newProps.model.isValid();
    this.setState({ ...attributes, formIsValid });
    // handle model's change
    newProps.model.off('change');
    newProps.model.on('change', this.handleChange);
  }

  handleUserInput = (e, field) => {
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

    this.props.model.set({ [fieldName]: fieldValue });
  }

  handleChange() {
    const formIsValid = this.props.model.isValid();
    const changedAttributes = this.props.model.changedAttributes();
    this.setState({ ...changedAttributes, formIsValid });
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
      <Modal
        classNames={{ modal: 'tamanu-modal' }}
        open={this.props.isVisible}
        onClose={onClose}
        little>
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
                autoFocus
                required
              />
              <div className="columns p-l-15 p-r-15">
                <DatepickerGroup
                  className="column is-half"
                  label="Date"
                  name="date"
                  value={date}
                  onChange={this.handleUserInput} />
                <SelectGroup
                  className="column is-half"
                  label="Certainty"
                  name="certainty"
                  options={diagnosisCertainty}
                  value={certainty}
                  onChange={this.handleUserInput} />
              </div>
              <CheckboxGroupNoPadding
                className="column"
                checked={secondaryDiagnosis}
                label="Secondary Diagnosis"
                name="secondaryDiagnosis"
                onChange={this.handleUserInput} />
              <CheckboxGroupNoPadding
                className="column"
                checked={active}
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
                      disabled={!formIsValid} />
                  </React.Fragment>}
                {action === 'new' &&
                  <AddButton
                    can={{ do: 'create', on: 'diagnosis' }}
                    type="submit"
                    disabled={!formIsValid} />}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}

DiagnosisModal.propTypes = {
  model: PropTypes.object.isRequired,
};

export default DiagnosisModal;
