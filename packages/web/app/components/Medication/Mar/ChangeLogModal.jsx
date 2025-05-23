
import React from 'react';
import { ConfirmCancelRow, Modal, TranslatedText } from "../..";
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { Divider } from '@material-ui/core';

const LogContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: ${Colors.white};
  padding: 20px 40px;
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
  height: calc(100vh - 300px);
  overflow-y: auto;
`;

const LogItem = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkText};
`;

const NoteText = styled.span`
  color: ${Colors.midText};
  font-size: 11px;
`;

const DoseLabel = styled.span`
  color: ${Colors.darkText};
  font-size: 14px;
  font-weight: 500;
  position: absolute;
  right: 0;
  top: 0;
`;

const StyledDivider = styled(Divider)`
  margin: 34px -32px 20px -32px;
`;

export const ChangeLogModal = ({ open, onClose, medication }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={<TranslatedText
          stringId="medication.mar.changeLog.title"
          fallback="Change Log | :medicationName"
          replacements={{ medicationName: medication.medication.name }}
        />
      }
    >
      <LogContainer>
        <LogItem>
          <span>Dose removed</span>
          <span>Reason for removal: Made a mistake</span>
          <NoteText>Dr Jim Wales 25/07/22 11:54am</NoteText>
          <DoseLabel>Dose 2</DoseLabel>
        </LogItem>
        <Divider color={Colors.outline} />
        <LogItem>
          <span>Dose given: 400mg</span>
          <span>Given by: Jane Smith</span>
          <span>Reason for removal: Made a mistake</span>
          <NoteText>Dr Jim Wales 25/07/22 11:54am</NoteText>
          <DoseLabel>Dose 1</DoseLabel>
        </LogItem>
      </LogContainer>
      <StyledDivider />
      <ConfirmCancelRow onConfirm={onClose} confirmText={<TranslatedText stringId="general.action.close" fallback="Close" />} />
    </Modal>
  );
};
