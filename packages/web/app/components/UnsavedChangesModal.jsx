import React from 'react';
import { TranslatedText } from '../components/Translation';
import { Modal } from './Modal';
import styled from 'styled-components';
import { ConfirmCancelBackRow } from './ButtonRow';
import { useAuth } from '../contexts/Auth';
import { Box, Divider } from '@material-ui/core';
import { Colors } from '../constants';

const StyledDivider = styled(Divider)`
  margin: 0 -32px 10px -32px;
`;

const ModalContent = styled.div`
  height: 210px;
  width: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: auto;
  margin-right: auto;
`;

export const UnsavedChangesModal = ({ open, onClose, onSave, onDiscard }) => {
  const { ability } = useAuth();
  const canWriteDischarge = ability.can('write', 'Discharge');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText stringId="general.modal.unsavedChanges.title" fallback="Unsaved Changes" />
      }
    >
      <ModalContent>
        <TranslatedText
          stringId="discharge.modal.unsavedChanges.message"
          fallback="You have unsaved changes. Are you sure you would like to discard these changes or would you like to 'Save & exit'?"
        />
      </ModalContent>
      <StyledDivider color={Colors.outline} />
      <ConfirmCancelBackRow
        onConfirm={onDiscard}
        confirmText={
          <Box whiteSpace="nowrap">
            <TranslatedText stringId="general.action.discardChanges" fallback="Discard changes" />
          </Box>
        }
        onCancel={onClose}
        cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
        {...(canWriteDischarge && { onBack: onSave })}
        backButtonText={
          <TranslatedText stringId="general.action.saveAndExit" fallback="Save & exit" />
        }
      />
    </Modal>
  );
};
