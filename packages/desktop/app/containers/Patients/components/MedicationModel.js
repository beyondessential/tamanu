import React, { Component } from 'react';
import {
  TextInput, Modal, FormRow, ModalActions,
  CancelButton, AddButton, UpdateButton,
} from '../../../components';
import { ProcedureMedicationModel } from '../../../models';

class NoteModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: false,
      Model: new ProcedureMedicationModel(),
    };

    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const {
      action, itemId, isVisible, procedureModel,
    } = nextProps;
    let Model;
    if (action === 'edit') {
      Model = procedureModel.get('medication').findWhere({ _id: itemId });
    } else {
      Model = new ProcedureMedicationModel();
    }
    this.setState({ isVisible, Model });
  }

  handleUserInput = (e, field) => {
    const { Model } = this.state;
    if (typeof field !== 'undefined') {
      Model.set(field, e, { silent: true });
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      Model.set(name, value, { silent: true });
    }
    this.setState({ Model });
  }

  submitForm = async (event) => {
    event.preventDefault();
    const { action, procedureModel } = this.props;
    const { Model } = this.state;

    try {
      await Model.save();
      if (action === 'new') {
        procedureModel.get('medication').add(Model);
        await procedureModel.save(null, { silent: true });
      } else {
        procedureModel.trigger('change');
      }
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const { onClose, action } = this.props;
    const { Model } = this.state;
    const form = Model.toJSON();
    return (
      <Modal
        title={`${action === 'new' ? 'Add' : 'Update'} Medication Used`}
        isVisible={this.state.isVisible}
        onClose={onClose}
      >
        <form
          id="noteForm"
          name="noteForm"
          onSubmit={this.submitForm}
        >
          <FormRow>
            <TextInput
              label="Medication Used"
              name="medication"
              onChange={this.handleUserInput}
              value={form.medication}
              required
            />
          </FormRow>
          <FormRow>
            <TextInput
              label="Quantity"
              name="quantity"
              onChange={this.handleUserInput}
              value={form.quantity}
              required
            />
          </FormRow>
          <ModalActions>
            <CancelButton onClick={onClose} />
            {action === 'new'
              ? (
                <AddButton
                  type="submit"
                  disabled={!Model.isValid()}
                  can={{ do: 'create', on: 'ProcedureMedication' }}
                />
              )
              : (
                <UpdateButton
                  type="submit"
                  disabled={!Model.isValid()}
                  can={{ do: 'update', on: 'ProcedureMedication' }}
                />
              )
            }
          </ModalActions>
        </form>
      </Modal>
    );
  }
}

export default NoteModal;
