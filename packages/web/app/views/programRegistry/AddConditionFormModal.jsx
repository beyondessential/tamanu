import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { differenceBy } from 'lodash';
import {
  AutocompleteField,
  ConfirmCancelRow,
  Field,
  Form,
  FormGrid,
  FormSeparatorLine,
  Modal,
} from '../../components';
import { useApi } from '../../api';
import { foreignKey } from '../../utils/validation';
import { FORM_TYPES } from '../../constants';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';

const StyledFormGrid = styled(FormGrid)`
  grid-column: 1 / -1;
  width: 100%;
  display: block;
  margin: auto;
  margin-top: 30px;
`;

export const AddConditionFormModal = ({
  onClose,
  patientProgramRegistration,
  patientProgramRegistrationConditions,
  programRegistryConditions,
  open,
}) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { getTranslation } = useTranslation();
  const { currentUser } = useAuth();

  const submit = async data => {
    await api.post(
      `patient/${encodeURIComponent(
        patientProgramRegistration.patientId,
      )}/programRegistration/${encodeURIComponent(
        patientProgramRegistration.programRegistryId,
      )}/condition`,
      {
        ...data,
        clinicianId: currentUser.id,
      },
    );
    queryClient.invalidateQueries(['PatientProgramRegistryConditions']);
    onClose();
  };
  return (
    <Modal
      title={
        <TranslatedText
          stringId="programRegistry.modal.addCondition.title"
          fallback="Add related condition"
          data-testid='translatedtext-7okc' />
      }
      open={open}
      onClose={onClose}
      data-testid='modal-dk9s'>
      <Form
        showInlineErrorsOnly
        onSubmit={submit}
        formType={FORM_TYPES.CREATE_FORM}
        render={({ submitForm }) => {
          const handleCancel = () => onClose();
          return (
            <div>
              <StyledFormGrid columns={1} data-testid='styledformgrid-cwx3'>
                <Field
                  name="programRegistryConditionId"
                  label={
                    <TranslatedText
                      stringId="programRegistry.relatedCondition.label"
                      fallback="Related condition"
                      data-testid='translatedtext-63ek' />
                  }
                  component={AutocompleteField}
                  options={differenceBy(
                    programRegistryConditions,
                    patientProgramRegistrationConditions,
                    'value',
                  )}
                  data-testid='field-e7et' />
              </StyledFormGrid>
              <FormSeparatorLine
                style={{ marginTop: '60px', marginBottom: '30px' }}
                data-testid='formseparatorline-fh25' />
              <ConfirmCancelRow
                onConfirm={submitForm}
                onCancel={handleCancel}
                data-testid='confirmcancelrow-z6iu' />
            </div>
          );
        }}
        validationSchema={yup.object().shape({
          programRegistryConditionId: foreignKey().required(
            getTranslation('validation.required.inline', '*Required'),
          ),
        })}
        data-testid='form-j1h4' />
    </Modal>
  );
};
