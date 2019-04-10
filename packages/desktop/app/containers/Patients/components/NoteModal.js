import React, { Component } from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import {
  TextInput, PatientRelationSelect, Modal, ModalActions,
  AddButton, UpdateButton, CancelButton, FormRow,
} from '../../../components';
import { NoteModel, VisitModel } from '../../../models';
import { VISIT_SELECT_TEMPLATE } from '../../../constants';

export default class NoteModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: false,
      noteModel: new NoteModel(),
      visitId: '',
    };

    this.submitForm = this.submitForm.bind(this);
    this.handleUserInput = this.handleUserInput.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const {
      action, itemId, isVisible, parentModel,
    } = nextProps;
    let noteModel = new NoteModel();
    if (action === 'edit') {
      noteModel = parentModel.get('notes').findWhere({ _id: itemId });
      if (noteModel.get('dateRecorded') !== '') noteModel.set('dateRecorded', moment(noteModel.get('dateRecorded')));
    }
    this.setState({ isVisible, noteModel });
  }

  handleUserInput = (e, field) => {
    const { noteModel } = this.state;
    if (field === 'visit') {
      this.setState({ visitId: e });
    } else {
      if (typeof field !== 'undefined') {
        noteModel.set(field, e, { silent: true });
      } else {
        const { name } = e.target;
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        noteModel.set(name, value, { silent: true });
      }
      this.setState({ noteModel });
    }
  }

  submitForm = async (e) => {
    e.preventDefault();
    const { action, parentModel } = this.props;
    const { noteModel, visitId } = this.state;
    if (visitId !== '') {
      parentModel.set({ _id: visitId });
      await parentModel.fetch();
    }
    try {
      await noteModel.save();
      if (action === 'new') {
        parentModel.get('notes').add(noteModel);
        await parentModel.save(null, { silent: true });
      } else {
        parentModel.trigger('change');
      }
      this.props.onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  render() {
    const {
      onClose, action, patientModel, showVisits,
    } = this.props;
    const { noteModel } = this.state;
    const form = noteModel.toJSON();
    return (
      <Modal
        title={`${action === 'new' ? 'Add' : 'Update'} Note`}
        isVisible={this.state.isVisible}
        onClose={onClose}
      >
        <form
          id="noteForm"
          name="noteForm"
          onSubmit={this.submitForm}
        >
          <Grid container spacing={16}>
            <FormRow>
              <TextInput
                label="Note"
                name="content"
                onChange={this.handleUserInput}
                value={form.content}
                rows={3}
                variant="outlined"
                multiline
                required
              />
            </FormRow>
            {showVisits
              && (
                <FormRow>
                  <PatientRelationSelect
                    patient={patientModel.id}
                    relation="visits"
                    template={VISIT_SELECT_TEMPLATE}
                    label="Visit"
                    name="visit"
                    onChange={val => this.handleUserInput(val, 'visit')}
                    required
                  />
                </FormRow>
              )
            }
            <FormRow>
              <TextInput
                label="On Behalf Of"
                name="attribution"
                onChange={this.handleUserInput}
                value={form.attribution}
              />
            </FormRow>
          </Grid>
          <ModalActions>
            <CancelButton onClick={onClose} />
            {action === 'new'
              ? (
                <AddButton
                  form="noteForm"
                  type="submit"
                  disabled={!noteModel.isValid()}
                  can={{ do: 'create', on: 'note' }}
                />
              )
              : (
                <UpdateButton
                  form="noteForm"
                  type="submit"
                  disabled={!noteModel.isValid()}
                  can={{ do: 'update', on: 'note' }}
                />
              )
            }
          </ModalActions>
        </form>
      </Modal>
    );
  }
}

NoteModal.propTypes = {
  action: PropTypes.string,
  itemId: PropTypes.string,
  isVisible: PropTypes.bool.isRequired,
  parentModel: PropTypes.instanceOf(VisitModel),
  showVisits: PropTypes.bool,
};

NoteModal.defaultProps = {
  action: 'new',
  itemId: '',
  parentModel: new VisitModel(),
  showVisits: false,
};
