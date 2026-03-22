import React from 'react';
import styled from 'styled-components';

import { Modal, TranslatedText } from '@tamanu/ui-components';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';

import { ModalCancelRow } from '../../components';
import { useTranslation } from '../../contexts/Translation';


const Text = styled.div`
  padding: 45px 0 60px;
  line-height: 1.5;
`;

export const RecordedInErrorWarningModal = ({ onConfirm, onClose, open, items = [] }) => {
  const { getTranslation } = useTranslation();
  const names = items.map(
    item =>
      `'${getTranslation(
        getReferenceDataStringId(item.id, 'programRegistryCondition'),
        item.name,
      )}'`,
  );

  const text =
    names.length > 1
      ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]
      : names[0] || '';

  return (
    <Modal
      title={
        <TranslatedText
          stringId="programRegistry.recordedInErrorWarning.title"
          fallback="Change status to recorded in error"
        />
      }
      width="sm"
      open={open}
      onClose={onClose}
    >
      <Text>
        <TranslatedText
          stringId="programRegistry.recordedInErrorWarning.text"
          fallback="Are you sure you would like to change the status of :text to 'Recorded in error'? This action is irreversible."
          replacements={{ text }}
        />
      </Text>
      <ModalCancelRow onConfirm={onConfirm} onCancel={onClose} />
    </Modal>
  );
};
