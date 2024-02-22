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

  const submit = async data => {
    await api.post(
      `patient/${encodeURIComponent(
        patientProgramRegistration.patientId,
      )}/programRegistration/${encodeURIComponent(
        patientProgramRegistration.programRegistryId,
      )}/condition`,
      data,
    );
    queryClient.invalidateQueries(['PatientProgramRegistryConditions']);
    onClose();
  };
  return (
    <Modal title="Add related condition" open={open} onClose={onClose}>
      <Form
        showInlineErrorsOnly
        onSubmit={submit}
        render={({ submitForm }) => {
          const handleCancel = () => onClose();
          return (
            <div>
              <StyledFormGrid columns={1}>
                <Field
                  name="programRegistryConditionId"
                  label="Related condition"
                  component={AutocompleteField}
                  options={differenceBy(
                    programRegistryConditions,
                    patientProgramRegistrationConditions,
                    'value',
                  )}
                />
              </StyledFormGrid>
              <FormSeparatorLine style={{ marginTop: '60px', marginBottom: '30px' }} />
              <ConfirmCancelRow onConfirm={submitForm} onCancel={handleCancel} />
            </div>
          );
        }}
        validationSchema={yup.object().shape({
          programRegistryConditionId: foreignKey().required('Condition must be selected'),
        })}
      />
    </Modal>
  );
};
