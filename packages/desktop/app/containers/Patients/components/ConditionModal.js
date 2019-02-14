import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import moment from 'moment';
import { InputGroup, AddButton, CancelButton,
          DeleteButton, UpdateButton, DatepickerGroup,
          Modal as DeleteConfirmModal } from '../../../components';

class ConditionModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deleteModalVisible: false
    };
    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  }

  handleUserInput = (event, field) => {
    const { model: Model } = this.props;
    let fieldName = field;
    let fieldValue = '';

    if (event instanceof moment || typeof event.target === "undefined") {
      fieldValue = event;
    } else {
      const { name } = event.target;
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      fieldName = name;
      fieldValue = value;
    }

    Model.set({ [fieldName]: fieldValue });
    this.forceUpdate(); // re-render
  }

  submitForm = async (event) => {
    event.preventDefault();
    const { action, model: Model, patientModel } = this.props;

    try {
      await Model.save();
      if (action === 'new') {
        patientModel.get('conditions').add(Model);
        await patientModel.save();
      } else {
        patientModel.trigger('change');
      }

      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  async deleteItem() {
    const {
      itemId: _id,
      model: Model,
      patientModel
    } = this.props;

    try {
      this.deleteModalClose();
      patientModel.get('conditions').remove({ _id });
      await patientModel.save();
      await Model.destroy();
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  deleteItemConfirm() {
    this.setState({ deleteModalVisible: true });
  }

  deleteModalClose() {
    this.setState({ deleteModalVisible: false });
  }

  render() {
    const { deleteModalVisible } = this.state;
    const {
      onClose,
      action,
      model: Model
    } = this.props;
    const { attributes: form } = Model;

    return (
      <React.Fragment>
        <Modal
          classNames={{ modal: 'tamanu-modal' }}
          open={this.props.isVisible}
          onClose={onClose}
          little
        >
          <form
            name="conditionForm"
            className="create-container"
            onSubmit={this.submitForm}
          >
            <div className="condition-modal">
              <div className="modal-header">
                <h2>{action === 'new' ? 'Add' : 'Update'} Condition</h2>
              </div>
              <div className="modal-content">
                <InputGroup
                  className="field column m-b-10"
                  name="condition"
                  label="Condition"
                  value={form.condition}
                  onChange={this.handleUserInput}
                  autoFocus
                  required
                />
                <DatepickerGroup
                  className="column is-half"
                  label="Date of Diagnosis"
                  name="date"
                  popperPlacement="bottom-start"
                  value={form.date}
                  onChange={this.handleUserInput}
                  required
                />
                <div className="is-clearfix" />
              </div>
              <div className="modal-footer">
                <div className="column has-text-right">
                  {action !== 'new' &&
                    <React.Fragment>
                      <DeleteButton
                        can={{ do: 'delete', on: 'condition' }}
                        onClick={this.deleteItemConfirm.bind(this)} />
                      <UpdateButton
                        can={{ do: 'update', on: 'condition' }}
                        type="submit"
                        disabled={!Model.isValid()} />
                    </React.Fragment>}
                  {action === 'new' &&
                    <React.Fragment>
                      <CancelButton
                        onClick={onClose} />
                      <AddButton
                        can={{ do: 'create', on: 'condition' }}
                        type="submit"
                        disabled={!Model.isValid()} />
                    </React.Fragment>}
                </div>
              </div>
            </div>
          </form>
        </Modal>

        <DeleteConfirmModal
          modalType="confirm"
          headerTitle="Delete Ongoing Condition?"
          contentText="Are you sure you want to delete this ongoing condition?"
          isVisible={deleteModalVisible}
          onConfirm={this.deleteItem.bind(this)}
          onClose={this.deleteModalClose.bind(this)}
        />
      </React.Fragment>
    );
  }
}

export default ConditionModal;
