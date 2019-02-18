import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import { InputGroup } from '../../../components';
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
    const { action, itemId, isVisible, procedureModel } = nextProps;
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

  submitForm = async (e) => {
    e.preventDefault();
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
      <Modal open={this.state.isVisible} onClose={onClose} little>
        <form
          id="noteForm"
          name="noteForm"
          className="create-container"
          onSubmit={this.submitForm}
        >
          <div className="tamanu-error-modal diagnosis-modal">
            <div className="modal-header">
              <h2>{action === 'new' ? 'Add' : 'Update'} Medication Used</h2>
            </div>
            <div className="modal-content">
              <InputGroup
                label="Medication Used"
                name="medication"
                className="column m-b-0"
                inputClass="column no-padding"
                onChange={this.handleUserInput}
                value={form.medication}
                required
              />
              <InputGroup
                label="Quantity"
                name="quantity"
                className="column m-b-0"
                inputClass="column no-padding"
                onChange={this.handleUserInput}
                value={form.quantity}
                required
              />
            </div>
            <div className="modal-footer">
              <div className="column has-text-right">
                <button className="button is-default" type="button" onClick={onClose}>Cancel</button>
                <button className="button is-primary" type="submit" form="noteForm" disabled={!Model.isValid()}>{action === 'new' ? 'Add' : 'Update'}</button>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    );
  }
}

export default NoteModal;
