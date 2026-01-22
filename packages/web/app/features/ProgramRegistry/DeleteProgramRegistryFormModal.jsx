import React from 'react';
import styled from 'styled-components';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Typography } from '@material-ui/core';

import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';

import { ModalCancelRow } from '../../components/index.js';
import { useApi } from '../../api/index.js';
import { Modal, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections.jsx';
import { useTranslation } from '../../contexts/Translation.jsx';

const Body = styled.div`
  padding: 40px 20px 50px;

  h3 {
    color: ${Colors.alert};
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 16px;
  }

  p {
    line-height: 1.5;
  }
`;

const useDeletePatientProgramRegistration = (patientProgramRegistration = {}, onSuccess) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { id: registrationId, patientId } = patientProgramRegistration;

  return useMutation({
    mutationFn: async () => {
      return api.delete(`patient/programRegistration/${registrationId}`);
    },
    onSuccess: async () => {
      await queryClient.resetQueries(['patient', patientId]);
      await queryClient.invalidateQueries([
        `infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`,
      ]);
      onSuccess();
    },
  });
};

export const DeleteProgramRegistryFormModal = ({ patientProgramRegistration, onClose, open }) => {
  const { getTranslation } = useTranslation();
  const {
    mutate: deleteProgramRegistry,
  } = useDeletePatientProgramRegistration(patientProgramRegistration, () =>
    onClose({ success: true }),
  );

  if (!patientProgramRegistration) {
    return null;
  }

  const { programRegistry, programRegistryId } = patientProgramRegistration;

  return (
    <Modal
      title={
        <TranslatedText
          stringId="programRegistry.modal.deleteRegistry.title"
          fallback="Delete record"
        />
      }
      width="sm"
      open={open}
      onClose={onClose}
    >
      <Body>
        <Typography variant="h3">
          <TranslatedText
            stringId="programRegistry.modal.deleteRegistry.header"
            fallback="Confirm patient registry deletion"
          />
        </Typography>
        <Typography variant="body2">
          <TranslatedText
            stringId="programRegistry.modal.deleteRegistry.description"
            fallback="Are you sure you would like to delete the patient from the :programRegistry? This will delete associated patient registry records. This action is irreversible."
            replacements={{
              programRegistry: getTranslation(
                getReferenceDataStringId(programRegistryId, 'programRegistry'),
                programRegistry?.name,
              ),
            }}
          />
        </Typography>
      </Body>
      <ModalCancelRow onConfirm={deleteProgramRegistry} onCancel={onClose} />
    </Modal>
  );
};
