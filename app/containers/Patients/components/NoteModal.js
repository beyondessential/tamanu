import React, { Component } from 'react';
import Modal from 'react-responsive-modal';
import moment from 'moment';
import { capitalize } from 'lodash';
import { InputGroup, PatientRelationSelect, TextareaGroup } from '../../../components';
import { NoteModel } from '../../../models';
import { dateFormat } from '../../../constants';

class NoteModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: false,
      Model: new NoteModel(),
    };

    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { action, itemId, isVisible, model: VisitModel } = nextProps;
    let Model;
    if (action === 'edit') {
      Model = VisitModel.get('notes').findWhere({ _id: itemId });
      if (Model.get('dateRecorded') !== '') Model.set('dateRecorded', moment(Model.get('dateRecorded')));
    } else {
      Model = new NoteModel();
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
    const { action, model: VisitModel } = this.props;
    const { Model } = this.state;

    try {
      await Model.save();
      if (action === 'new') {
        VisitModel.get('notes').add(Model.attributes);
        await VisitModel.save(null, { silent: true });
      } else {
        VisitModel.trigger('change');
      }
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const { onClose, action, patientModel } = this.props;
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
              <h2>{action === 'new' ? 'Add' : 'Update'} Note</h2>
            </div>
            <div className="modal-content">
              <div className="column">
                <TextareaGroup
                  label="Note"
                  name="content"
                  className="column m-b-0"
                  inputClass="column is-2 no-padding"
                  onChange={this.handleUserInput}
                  value={form.content}
                  required
                />
              </div>
              {/* <PatientRelationSelect
                patient={patientModel.id}
                relation="visits"
                tmpl={visit => `${moment(visit.startDate).format(dateFormat)} (${capitalize(visit.visitType)})`}
                label="Visit"
                name="visit"
                required
              /> */}
              <InputGroup
                label="On Behalf Of"
                name="attribution"
                className="column m-b-0"
                inputClass="column no-padding"
                onChange={this.handleUserInput}
                value={form.attribution}
              />
            </div>
            <div className="modal-footer">
              <div className="column has-text-right">
                <button className="button is-default" type="button" onClick={onClose}>Cancel</button>
                {/* <button className={action !== 'new' ? 'button is-danger' : 'button is-danger is-hidden'} type="button" onClick={this.deleteItem}>Delete</button> */}
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
