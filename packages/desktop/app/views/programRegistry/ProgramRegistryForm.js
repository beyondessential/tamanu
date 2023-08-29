import React, { useState } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { Form, Field, DateField, AutocompleteField } from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import { ConfirmCancelRow } from '../../components/ButtonRow';

import { foreignKey, optionalForeignKey } from '../../utils/validation';
import { useApi } from '../../api';
import { Suggester } from '../../utils/suggester';

export const ProgramRegistryForm = React.memo(({ onCancel, onSubmit, editedObject }) => {
  const api = useApi();
  const [programRegistryId, setProgramRegistryId] = useState();
  const programRegistryStatusSuggester = new Suggester(api, 'programRegistryStatus', {
    baseQueryParameters: { programRegistryId },
  });
  const programRegistrySuggester = new Suggester(api, 'programRegistry');
  const registeringFacilitySuggester = new Suggester(api, 'registeringFacility');
  const registeredBySuggester = new Suggester(api, 'registeredBy');
  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm, values }) => {
        const handleCancel = () => onCancel && onCancel();
        const getButtonText = isCompleted => {
          if (isCompleted) return 'Finalise';
          if (editedObject?.id) return 'Update';
          return 'Submit';
        };

        const isCompleted = !!values.completed;
        const buttonText = getButtonText(isCompleted);
        return (
          <div>
            <FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="programRegistryId"
                  label="Program registry"
                  required
                  component={AutocompleteField}
                  suggester={programRegistrySuggester}
                  onChange={id => {
                    setProgramRegistryId(id);
                  }}
                />
                <Field
                  name="status"
                  label="Status"
                  component={AutocompleteField}
                  suggester={programRegistryStatusSuggester}
                  disabled={!programRegistryId}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="date"
                  label="Date of registration"
                  saveDateAsString
                  required
                  component={DateField}
                />
                <Field
                  name="registeredById"
                  label="Registered by"
                  required
                  component={AutocompleteField}
                  suggester={registeredBySuggester}
                />
              </FormGrid>
              <FormGrid style={{ gridColumn: 'span 2' }}>
                <Field
                  name="registeringFacilityId"
                  label="Registering facility"
                  required
                  component={AutocompleteField}
                  suggester={registeringFacilitySuggester}
                />
              </FormGrid>

              <ConfirmCancelRow
                onCancel={handleCancel}
                onConfirm={submitForm}
                confirmText={buttonText}
              />
            </FormGrid>
          </div>
        );
      }}
      initialValues={{
        date: getCurrentDateTimeString(),
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        programRegistryId: foreignKey('Procedure must be selected'),
        date: yup.date().required(),
        registeringFacilityId: foreignKey('Register facility must be selected'),
        status: optionalForeignKey(),
        registeredById: foreignKey('Registered by must be selected'),
      })}
    />
  );
});

ProgramRegistryForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

ProgramRegistryForm.defaultProps = {
  editedObject: null,
};
