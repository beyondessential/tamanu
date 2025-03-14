import React from 'react';
import styled from 'styled-components';
import { Modal, ModalCancelRow, TranslatedText } from '../../components';

const Text = styled.div`
  padding: 45px 0 60px;
  line-height: 1.5;
`;

export const RecordedInErrorWarningModal = ({ onConfirm, onClose, open, items }) => {
  // const { getTranslation } = useTranslation();
  // const names = items.map(
  //   item => `'${getTranslation(getReferenceDataStringId(item.id, 'programRegistryCondition'), item.name)}'`,
  // );
  // Todo: Uncomment the above code and remove the below code after adding the translations for the programRegistryConditions
  const names = items.map(item => `'${item.name}'`);
  const text =
    names.length > 1
      ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]
      : names[0] || '';

  return (
    <Modal
      title={
        <TranslatedText
          stringId="patientProgramRegistry.recordedInErrorWarning.title"
          fallback="Change status to recorded in error"
        />
      }
      width="sm"
      open={open}
      onClose={onClose}
    >
      <Text>
        <TranslatedText
          stringId="patientProgramRegistry.recordedInErrorWarning.text"
          fallback="Are you sure you would like to change the status of :text to 'Recorded in error'? This action is irreversible."
          replacements={{ text }}
        />
      </Text>
      <ModalCancelRow onConfirm={onConfirm} onCancel={onClose} />
    </Modal>
  );
};
