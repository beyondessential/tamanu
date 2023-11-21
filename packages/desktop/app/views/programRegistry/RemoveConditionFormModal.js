import React from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { Modal, ConfirmCancelRow, FormSeparatorLine } from '../../components';
import { useApi } from '../../api';

const Text = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-content: center;
  p {
    text-align: start;
  }
`;

export const RemoveConditionFormModal = ({
  patientProgramRegistration,
  conditionToRemove,
  onSubmit,
  onCancel,
  open,
}) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const removeCondition = async () => {
    await api.delete(
      `patient/${encodeURIComponent(
        patientProgramRegistration.patientId,
      )}/programRegistration/${encodeURIComponent(
        patientProgramRegistration.programRegistryId,
      )}/condition/${encodeURIComponent(conditionToRemove.id)}`,
    );
    queryClient.invalidateQueries(['PatientProgramRegistryConditions']);
    onSubmit();
  };
  return (
    <Modal title="Remove condition" open={open} onClose={onCancel}>
      <Text>
        {`Are you sure you would like to remove the condition of ‘${conditionToRemove.programRegistryCondition.name}' from the patients program condition record?`}
      </Text>
      <FormSeparatorLine style={{ marginTop: '30px', marginBottom: '30px' }} />
      <ConfirmCancelRow onConfirm={removeCondition} onCancel={onCancel} />
    </Modal>
  );
};
