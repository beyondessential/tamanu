import React from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  DateField,
  AddButton,
  ModalActions,
  UpdateButton,
  CancelButton,
  FormRow,
  Modal,
  Field,
  Form,
} from '../../../components';
import { VitalModel } from '../../../models';

export default function VitalModal({ onClose, action, isVisible, itemId, visitModel }) {
  let vitalModel = new VitalModel();
  if (action === 'edit') vitalModel = visitModel.get('vitals').findWhere({ _id: itemId });

  const handleFormSubmit = async values => {
    try {
      vitalModel.set(values);
      await vitalModel.save();

      if (action === 'new') {
        visitModel.get('vitals').add(vitalModel);
        await visitModel.save();
      } else {
        visitModel.trigger('change');
      }

      onClose();
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  return (
    <Modal
      title={`${action === 'new' ? 'Add' : 'Update'} Vitals`}
      isVisible={isVisible}
      onClose={onClose}
    >
      <Form
        onSubmit={handleFormSubmit}
        initialValues={vitalModel.toJSON()}
        render={({ isSubmitting, submitForm }) => (
          <React.Fragment>
            <FormRow>
              <Field component={DateField} label="Recorded At" name="dateRecorded" />
            </FormRow>
            <FormRow>
              <Field
                component={TextField}
                type="number"
                label="Temperature (°C)"
                name="temperature"
              />
              <Field
                component={TextField}
                type="number"
                label="Blood Sugar Level (mmol/L)"
                name="bloodSugarLevel"
              />
            </FormRow>
            <FormRow>
              <Field component={TextField} type="number" label="Weight (kg)" name="weight" />
              <Field component={TextField} type="number" label="Height (cm)" name="height" />
            </FormRow>
            <FormRow>
              <Field component={TextField} type="number" label="SBP" name="sbp" />
              <Field component={TextField} type="number" label="DBP" name="dbp" />
            </FormRow>
            <FormRow>
              <Field component={TextField} type="number" label="Heart Rate" name="heartRate" />
              <Field
                component={TextField}
                type="number"
                label="Respiratory Rate"
                name="respiratoryRate"
              />
            </FormRow>
            <ModalActions>
              <CancelButton onClick={onClose} />
              {action === 'new' && (
                <AddButton
                  type="button"
                  disabled={isSubmitting}
                  can={{ do: 'create', on: 'vital' }}
                  onClick={submitForm}
                />
              )}
              {action !== 'new' && (
                <UpdateButton
                  type="button"
                  disabled={isSubmitting}
                  can={{ do: 'update', on: 'vital' }}
                  onClick={submitForm}
                />
              )}
            </ModalActions>
          </React.Fragment>
        )}
      />
    </Modal>
  );
}

VitalModal.propTypes = {
  visitModel: PropTypes.instanceOf(Object).isRequired,
  onClose: PropTypes.func.isRequired,
  itemId: PropTypes.string,
  isVisible: PropTypes.bool,
  action: PropTypes.string,
};

VitalModal.defaultProps = {
  itemId: '',
  isVisible: false,
  action: 'new',
};
