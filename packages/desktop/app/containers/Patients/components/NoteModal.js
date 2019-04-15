import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import {
  TextField, PatientVisitSelectField, Modal, ModalActions,
  AddButton, UpdateButton, CancelButton, FormRow, Form, Field,
} from '../../../components';
import { NoteModel, VisitModel } from '../../../models';

export default function NoteModal({
  action, itemId, isVisible, parentModel, onClose, showVisits, patientModel,
}) {
  let noteModel = new NoteModel();
  if (itemId) noteModel = parentModel.get('notes').findWhere({ _id: itemId });

  const handleFormSubmit = async values => {
    // set visit if selected
    if (values.visit) {
      parentModel.set({ _id: values.visit });
      await parentModel.fetch();
    }
    // save our data
    try {
      noteModel.set(values);
      await noteModel.save();
      if (action === 'new') {
        parentModel.get('notes').add(noteModel);
        await parentModel.save(null, { silent: true });
      } else {
        parentModel.trigger('change');
      }
      onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  return (
    <Modal
      title={`${action === 'new' ? 'Add' : 'Update'} Note`}
      isVisible={isVisible}
      onClose={onClose}
    >
      <Form
        initialValues={noteModel.toJSON()}
        validationSchema={noteModel.validationSchema}
        onSubmit={handleFormSubmit}
        render={({ isSubmitting, submitForm }) => (
          <React.Fragment>
            <Grid container spacing={16}>
              <FormRow>
                <Field
                  component={TextField}
                  label="Note"
                  name="content"
                  rows={3}
                  multiline
                  required
                />
              </FormRow>
              {showVisits
                && (
                  <FormRow>
                    <Field
                      component={PatientVisitSelectField}
                      patientModel={patientModel}
                      name="visit"
                      required
                    />
                  </FormRow>
                )
              }
              <FormRow>
                <Field
                  component={TextField}
                  label="On Behalf Of"
                  name="attribution"
                />
              </FormRow>
            </Grid>
            <ModalActions>
              <CancelButton onClick={onClose} />
              {action === 'new'
                ? (
                  <AddButton
                    type="button"
                    disabled={isSubmitting}
                    can={{ do: 'create', on: 'note' }}
                    onClick={submitForm}
                  />
                )
                : (
                  <UpdateButton
                    type="submit"
                    disabled={isSubmitting}
                    can={{ do: 'update', on: 'note' }}
                    onClick={submitForm}
                  />
                )
              }
            </ModalActions>
          </React.Fragment>
        )}
      />
    </Modal>
  );
}

NoteModal.propTypes = {
  action: PropTypes.string,
  itemId: PropTypes.string,
  isVisible: PropTypes.bool.isRequired,
  parentModel: PropTypes.instanceOf(Object),
  patientModel: PropTypes.instanceOf(Object).isRequired,
  showVisits: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

NoteModal.defaultProps = {
  action: 'new',
  itemId: '',
  parentModel: new VisitModel(),
  showVisits: false,
};
