import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { Form, Field, DateField, AutocompleteField } from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import { ConfirmCancelRow } from '../../components/ButtonRow';
import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { useSuggester } from '../../api';
import { useAuth } from '../../contexts/Auth';
import { Modal } from '../../components/Modal';

export const ActivateProgramRegistryFormModal = React.memo(
  ({ onCancel, onSubmit, editedObject, patient, programRegistry, open }) => {
    const { currentUser, facility } = useAuth();
    const programRegistryStatusSuggester = useSuggester('programRegistryClinicalStatus', {
      baseQueryParameters: { programRegistryId: programRegistry.id },
    });
    const registeredBySuggester = useSuggester('practitioner');
    const registeringFacilitySuggester = useSuggester('facility');

    return (
      <Modal
        title={`Activate ${programRegistry.name} program registry`}
        open={open}
        onClose={onCancel}
      >
        <Form
          onSubmit={data => {
            onSubmit({ ...data, patientId: patient.id, programRegistryId: programRegistry.id });
          }}
          render={({ submitForm }) => {
            const handleCancel = () => onCancel && onCancel();
            return (
              <div>
                <FormGrid>
                  <FormGrid style={{ gridColumn: 'span 2' }}>
                    <Field
                      name="programRegistryClinicalStatusId"
                      label="Status"
                      component={AutocompleteField}
                      suggester={programRegistryStatusSuggester}
                    />
                    <Field
                      name="date"
                      label="Date of registration"
                      saveDateAsString
                      component={DateField}
                      required
                    />
                  </FormGrid>
                  <FormGrid style={{ gridColumn: 'span 2' }}>
                    <Field
                      name="registeringClinicianId"
                      label="Registered by"
                      component={AutocompleteField}
                      suggester={registeredBySuggester}
                      required
                    />
                    <Field
                      name="facilityId"
                      label="Registering facility"
                      component={AutocompleteField}
                      suggester={registeringFacilitySuggester}
                      required
                    />
                  </FormGrid>
                  <ConfirmCancelRow
                    onCancel={handleCancel}
                    onConfirm={submitForm}
                    confirmText="Confirm"
                  />
                </FormGrid>
              </div>
            );
          }}
          initialValues={{
            date: getCurrentDateTimeString(),
            facilityId: facility.id,
            registeringClinicianId: currentUser.id,
            ...editedObject,
          }}
          validationSchema={yup.object().shape({
            programRegistryClinicalStatusId: optionalForeignKey(),
            date: yup.date().required('Date of registration must be selected'),
            registeringClinicianId: foreignKey().required('Registered by must be selected'),
            facilityId: foreignKey().required('Registering facility must be selected'),
          })}
        />
      </Modal>
    );
  },
);

ActivateProgramRegistryFormModal.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
  patient: PropTypes.shape({}).isRequired,
  programRegistry: PropTypes.shape({ id: PropTypes.string }).isRequired,
  open: PropTypes.bool.isRequired,
};

ActivateProgramRegistryFormModal.defaultProps = {
  editedObject: null,
};
