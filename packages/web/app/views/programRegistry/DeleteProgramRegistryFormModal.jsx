import React from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  ConfirmCancelRow,
  Modal,
  FormSeparatorLine,
  TranslatedText,
  getReferenceDataStringId,
} from '../../components';
import { useApi } from '../../api';
import { Colors } from '../../constants';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';
import { useTranslation } from '../../contexts/Translation';

const Text = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;
  padding: 20px 50px;
  .header {
    color: ${Colors.alert};
    font-size: large;
    margin-bottom: 0px;
    font-weight: 500;
  }
  .desc {
    text-align: start;
  }
`;

export const DeleteProgramRegistryFormModal = ({ patientProgramRegistration, onClose, open }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { getTranslation } = useTranslation();

  if (!patientProgramRegistration) return <></>;

  const deleteProgramRegistry = async () => {
    const { ...rest } = patientProgramRegistration;
    delete rest.id;
    delete rest.date;

    await api.post(
      `patient/${encodeURIComponent(patientProgramRegistration.patientId)}/programRegistration`,
      {
        ...rest,
        registrationStatus: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
        date: getCurrentDateTimeString(),
      },
    );

    queryClient.invalidateQueries([`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`]);
    onClose({ success: true });
  };

  const { programRegistry, programRegistryId } = patientProgramRegistration;

  return (
    <Modal
      title={
        <TranslatedText
          stringId="programRegistry.modal.deleteRegistry.title"
          fallback="Delete record"
          data-testid='translatedtext-wf34' />
      }
      width="sm"
      open={open}
      onClose={onClose}
      overrideContentPadding
      data-testid='modal-3c9i'>
      <Text data-testid='text-pbir'>
        <p className="header">
          <TranslatedText
            stringId="programRegistry.modal.deleteRegistry.header"
            fallback="Confirm patient registry deletion"
            data-testid='translatedtext-qnqn' />
        </p>
        <p className="desc">
          <TranslatedText
            stringId="programRegistry.modal.deleteRegistry.description"
            fallback="Are you sure you would like to delete the patient from the :programRegistry? This will delete associated patient registry records. This action is irreversible."
            replacements={{
              programRegistry: getTranslation(
                getReferenceDataStringId(programRegistryId, 'programRegistry'),
                programRegistry?.name,
              ),
            }}
            data-testid='translatedtext-8t72' />
        </p>
      </Text>
      <FormSeparatorLine
        style={{ marginTop: '30px', marginBottom: '30px' }}
        data-testid='formseparatorline-v3k3' />
      <ConfirmCancelRow
        style={{ padding: '0px 50px' }}
        onConfirm={deleteProgramRegistry}
        onCancel={onClose}
        data-testid='confirmcancelrow-8fmy' />
    </Modal>
  );
};
