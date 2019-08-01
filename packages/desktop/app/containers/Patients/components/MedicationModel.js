import React from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Modal,
  FormRow,
  ModalActions,
  Field,
  CancelButton,
  AddButton,
  UpdateButton,
  Form,
} from '../../../components';

export default function MedicationModal({ medicationModel, isVisible, onClose, procedureModel }) {
  const isNew = medicationModel.isNew();
  const handleFormSubmit = async values => {
    try {
      medicationModel.set(values);
      await medicationModel.save();
      if (isNew) {
        procedureModel.get('medication').add(medicationModel);
        await procedureModel.save();
      } else {
        procedureModel.trigger('change');
      }
      onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  return (
    <Modal
      title={`${isNew ? 'Add' : 'Update'} Medication Used`}
      isVisible={isVisible}
      onClose={onClose}
    >
      <Form
        showInlineErrorsOnly
        onSubmit={handleFormSubmit}
        initialValues={medicationModel.toJSON()}
        validationSchema={medicationModel.validationSchema}
        render={({ isSubmitting, submitForm }) => (
          <React.Fragment>
            <FormRow>
              <Field component={TextField} label="Medication Used" name="medication" required />
            </FormRow>
            <FormRow>
              <Field component={TextField} label="Quantity" name="quantity" required />
            </FormRow>
            <ModalActions>
              <CancelButton onClick={onClose} />
              {isNew ? (
                <AddButton
                  type="button"
                  disabled={isSubmitting}
                  onClick={submitForm}
                  can={{ do: 'create', on: 'ProcedureMedication' }}
                />
              ) : (
                <UpdateButton
                  type="button"
                  disabled={isSubmitting}
                  onClick={submitForm}
                  can={{ do: 'update', on: 'ProcedureMedication' }}
                />
              )}
            </ModalActions>
          </React.Fragment>
        )}
      />
    </Modal>
  );
}

MedicationModal.propTypes = {
  medicationModel: PropTypes.instanceOf(Object).isRequired,
  procedureModel: PropTypes.instanceOf(Object).isRequired,
  isVisible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

MedicationModal.defaultProps = {
  isVisible: false,
};
