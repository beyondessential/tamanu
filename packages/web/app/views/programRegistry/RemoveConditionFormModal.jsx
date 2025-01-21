import React from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { ConfirmCancelRow, FormSeparatorLine, Modal } from '../../components';
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
    try {
      await api.delete(
        `patient/${encodeURIComponent(
          patientProgramRegistration.patientId,
        )}/programRegistration/${encodeURIComponent(
          patientProgramRegistration.programRegistryId,
        )}/condition/${encodeURIComponent(conditionToRemove.id)}`,
        { deletionDate: getCurrentDateTimeString() },
      );
      toast.success('Related condition removed successfully');
      queryClient.invalidateQueries(['PatientProgramRegistryConditions']);
      onSubmit();
    } catch (e) {
      toast.error(`Failed to remove related condition with error: ${e.message}`);
    }
  };
  return (
    <Modal title="Remove related condition" open={open} onClose={onCancel}>
      <Text>
        {`Are you sure you would like to remove the related condition of ‘${conditionToRemove.programRegistryCondition.name}' from the patients program condition record?`}
      </Text>
      <FormSeparatorLine style={{ marginTop: '30px', marginBottom: '30px' }} />
      <ConfirmCancelRow onConfirm={removeCondition} onCancel={onCancel} />
    </Modal>
  );
};
