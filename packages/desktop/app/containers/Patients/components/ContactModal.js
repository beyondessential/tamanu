import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import {
  TextField,
  Modal,
  ModalActions,
  CancelButton,
  AddButton,
  UpdateButton,
  Form,
  Field,
} from '../../../components';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';

export default function ContactModal({ isVisible, patientModel, contactModel, onClose }) {
  const isNew = contactModel.isNew();
  const handleFormSubmit = async values => {
    try {
      contactModel.set(values);
      await contactModel.save();
      if (isNew) {
        patientModel.get('additionalContacts').add(contactModel);
        await patientModel.save(null, { silent: true });
      } else {
        patientModel.trigger('change');
      }
      onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  return (
    <Modal title={`${isNew ? 'Add' : 'Update'} Contact`} isVisible={isVisible} onClose={onClose}>
      <Form
        showInlineErrorsOnly
        onSubmit={handleFormSubmit}
        initialValues={contactModel.toJSON()}
        validationSchema={contactModel.validationSchema}
        render={({ isSubmitting, submitForm }) => (
          <Grid container spacing={spacing * 2} direction="column">
            <Grid item>
              <Field component={TextField} name="name" label="Name" required />
            </Grid>
            <Grid item>
              <Field component={TextField} name="phone" label="Phone" required />
            </Grid>
            <Grid item>
              <Field component={TextField} type="email" name="email" label="Email" />
            </Grid>
            <Grid item>
              <Field component={TextField} name="relationship" label="Relationship" />
            </Grid>
            <ModalActions>
              <CancelButton onClick={onClose} />
              {isNew ? (
                <AddButton
                  type="button"
                  onClick={submitForm}
                  disabled={isSubmitting}
                  can={{ do: 'create', on: 'condition' }}
                />
              ) : (
                <UpdateButton
                  type="button"
                  onClick={submitForm}
                  disabled={isSubmitting}
                  can={{ do: 'create', on: 'condition' }}
                />
              )}
            </ModalActions>
          </Grid>
        )}
      />
    </Modal>
  );
}

ContactModal.propTypes = {
  patientModel: PropTypes.instanceOf(Object).isRequired,
  contactModel: PropTypes.instanceOf(Object).isRequired,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
