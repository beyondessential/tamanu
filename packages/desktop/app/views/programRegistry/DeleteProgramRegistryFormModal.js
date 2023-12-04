import React from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { Modal, ConfirmCancelRow, FormSeparatorLine } from '../../components';
import { useApi } from '../../api';
import { PROGRAM_REGISTRY } from '../../components/PatientInfoPane/paneTitles';

const Text = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-content: center;
  p {
    text-align: start;
  }
`;

export const DeleteProgramRegistryFormModal = ({ patientProgramRegistration, onClose, open }) => {
  const api = useApi();
  const queryClient = useQueryClient();

  if (!patientProgramRegistration) return <></>;

  const deleteProgramRegistry = async () => {
    const { id, date, ...rest } = patientProgramRegistration;
    await api.post(
      `patient/${encodeURIComponent(patientProgramRegistration.patientId)}/programRegistration`,
      { ...rest, registrationStatus: 'deleted' },
    );

    queryClient.invalidateQueries([`infoPaneListItem-${PROGRAM_REGISTRY}`]);
    onClose();
  };

  return (
    <Modal title="Delete record" open={open} onClose={onClose}>
      {/* <div> */}
      <Text>
        <p>
          {`Are you sure you would like to delete the patient from the ${patientProgramRegistration?.programRegistry?.name} program registry? This will delete associated patient registry records. This action is irreversible.`}
        </p>
      </Text>
      <FormSeparatorLine style={{ marginTop: '30px', marginBottom: '30px' }} />
      <ConfirmCancelRow onConfirm={deleteProgramRegistry} onCancel={onClose} />
      {/* </div> */}
    </Modal>
  );
};
