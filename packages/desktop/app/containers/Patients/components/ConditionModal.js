import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import { InputGroup, AddButton, CancelButton,
          DeleteButton, UpdateButton, DatepickerGroup,
          Modal as DeleteConfirmModal } from '../../../components';

class ConditionModal extends Component {
  constructor(props) {
    super(props);
    const { conditionModel: { attributes } } = this.props;
    this.state = {
      ...attributes,
      formIsValid: false,
      deleteModalVisible: false
    };
    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
  }

  componentWillReceiveProps(newProps) {
    const { attributes } = newProps.conditionModel;
    const formIsValid = newProps.conditionModel.isValid();
    this.setState({ ...attributes, formIsValid });
    // handle conditionModel's change
    newProps.conditionModel.off('change');
    newProps.conditionModel.on('change', this.handleChange);
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
    const { conditionModel } = this.props;
    conditionModel.set({ [fieldName]: fieldValue });
  }

  handleChange() {
    const { conditionModel } = this.props;
    const formIsValid = conditionModel.isValid();
    const changedAttributes = conditionModel.changedAttributes();
    this.setState({ ...changedAttributes, formIsValid });
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

  async deleteItem() {
    const {
      itemId: _id,
      conditionModel,
      patientModel
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

  deleteItemConfirm() {
    this.setState({ deleteModalVisible: true });
  }

  deleteModalClose() {
    this.setState({ deleteModalVisible: false });
  }

  render() {
    const {
      condition,
      date,
      deleteModalVisible,
      formIsValid
    } = this.state;
    const {
      onClose,
      action,
      conditionModel
    } = this.props;
    const { attributes: form } = conditionModel;

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
                  value={condition}
                  onChange={this.handleFormInput}
                  autoFocus
                  required
                />
                <DatepickerGroup
                  className="column is-half"
                  label="Date of Diagnosis"
                  name="date"
                  popperPlacement="bottom-start"
                  value={date}
                  onChange={this.handleDateInput}
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
                        onClick={this.deleteItemConfirm.bind(this)} 
                      />
                      <UpdateButton
                        can={{ do: 'update', on: 'condition' }}
                        type="submit"
                        disabled={!formIsValid} 
                      />
                    </React.Fragment>
                  }
                  {action === 'new' &&
                    <React.Fragment>
                      <CancelButton onClick={onClose} />
                      <AddButton
                        can={{ do: 'create', on: 'condition' }}
                        type="submit"
                        disabled={!formIsValid} 
                      />
                    </React.Fragment>
                  }
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
