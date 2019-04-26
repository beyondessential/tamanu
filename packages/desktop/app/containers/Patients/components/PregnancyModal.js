import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import {
  TextField, Modal, DateField, SelectField, ModalActions,
  CancelButton, AddButton, UpdateButton, Form, Field,
  PatientAutocompleteField,
} from '../../../components';
import { pregnancyOutcomes, MUI_SPACING_UNIT as spacing } from '../../../constants';

export default function PregnancyModal({
  pregnancyModel, patientModel, isVisible, onClose,
}) {
  const isNew = pregnancyModel.isNew();
  const handleFormSubmit = async values => {
    try {
      pregnancyModel.set(values);
      await pregnancyModel.save();

      if (isNew) {
        patientModel.get('pregnancies').add(pregnancyModel);
        await patientModel.save();
      } else {
        patientModel.trigger('change');
      }
      onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  return (
    <Modal
      title={`${isNew ? 'Add' : 'Update'} Pregnancy`}
      isVisible={isVisible}
      onClose={onClose}
    >
      <Form
        showInlineErrorsOnly
        onSubmit={handleFormSubmit}
        initialValues={pregnancyModel.toJSON()}
        validationSchema={pregnancyModel.validationSchema}
        render={({ isSubmitting, submitForm, values }) => (
          <React.Fragment>
            <Grid container spacing={spacing * 2}>
              <Grid item xs={12}>
                <Field
                  component={DateField}
                  label="Estimated Conception Date"
                  name="conceiveDate"
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  component={SelectField}
                  label="Outcome"
                  options={pregnancyOutcomes}
                  name="outcome"
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  component={DateField}
                  label="Delivery Date"
                  name="deliveryDate"
                />
              </Grid>
              {values.outcome
                && values.outcome !== 'fetalDeath'
                && (
                  <Grid item xs={12}>
                    <Field
                      component={PatientAutocompleteField}
                      name="child._id"
                      label="Child"
                      filterModels={patient => patient._id !== patientModel.get('_id')}
                    />
                  </Grid>
                )
              }
              {values.outcome
                && (
                  <Grid item xs={12}>
                    <Field
                      component={PatientAutocompleteField}
                      name="father._id"
                      label="Father"
                      filterModels={patient => patient._id !== patientModel.get('_id')}
                    />
                  </Grid>
                )
              }
              {values.outcome === 'fetalDeath'
                && (
                  <Grid item xs={12}>
                    <Field
                      component={TextField}
                      name="gestationalAge"
                      label="Gestational Age"
                    />
                  </Grid>
                )
              }
            </Grid>
            <ModalActions>
              <CancelButton onClick={onClose} />
              {isNew
                ? (
                  <AddButton
                    type="button"
                    disabled={isSubmitting}
                    onClick={submitForm}
                  />
                )
                : (
                  <UpdateButton
                    type="button"
                    disabled={isSubmitting}
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

PregnancyModal.propTypes = {
  pregnancyModel: PropTypes.instanceOf(Object).isRequired,
  patientModel: PropTypes.instanceOf(Object).isRequired,
  onClose: PropTypes.func.isRequired,
  isVisible: PropTypes.bool,
};

PregnancyModal.defaultProps = {
  isVisible: false,
};
