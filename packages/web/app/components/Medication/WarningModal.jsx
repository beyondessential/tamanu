import React from 'react';
import { ConfirmModal } from '../ConfirmModal';
import { TranslatedText } from '../Translation';
import styled from 'styled-components';
import { MAR_WARNING_MODAL } from '../../constants/medication';

const Content = styled.div`
  font-size: 14px;
  margin: 0 auto;
  margin-bottom: -12px;
  height: 192px;
  max-width: 478px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  justify-content: center;
`;

export const WarningModal = ({ modal, onClose, onConfirm, isPast = false }) => {
  let title, text, secondaryText;

  switch (modal) {
    case MAR_WARNING_MODAL.PAUSED:
      title = (
        <TranslatedText
          stringId="medication.mar.paused.warning.title"
          fallback="Paused medication"
        />
      );
      text = (
        <TranslatedText
          stringId="medication.mar.paused.warning.text"
          fallback="This medication is currently paused. Please confirm that you would like to continue recording a dose for the selected time."
        />
      );
      if (isPast) {
        title = (
          <TranslatedText
            stringId="medication.mar.medicationWarning.title"
            fallback="Medication warning"
          />
        );
        secondaryText = (
          <TranslatedText
            stringId="medication.mar.past.warning.secondaryText"
            fallback="You are also recording a dose in the past. Please confirm that you would like to continue recording a dose for the selected time."
          />
        );
      }
      break;
    case MAR_WARNING_MODAL.FUTURE:
      title = (
        <TranslatedText stringId="medication.mar.future.warning.title" fallback="Dose not due" />
      );
      text = (
        <TranslatedText
          stringId="medication.mar.future.warning.text"
          fallback="This medication is not due. Please confirm that you would like to continue recording a dose for the selected time."
        />
      );
      break;
    case MAR_WARNING_MODAL.PAST:
      title = (
        <TranslatedText
          stringId="medication.mar.past.warning.title"
          fallback="Recording past dose"
        />
      );
      text = (
        <TranslatedText
          stringId="medication.mar.past.warning.text"
          fallback="You are recording a dose in the past. Please confirm that you would like to continue recording a dose for the selected time."
        />
      );
      break;
    case MAR_WARNING_MODAL.NOT_MATCHING_DOSE:
      title = (
        <TranslatedText
          stringId="medication.mar.notMatchingDose.warning.title"
          fallback="Dose amount does not match prescription"
        />
      );
      text = (
        <TranslatedText
          stringId="medication.mar.notMatchingDose.warning.text"
          fallback="The dose amount recorded does not match the prescribed dose amount. Please confirm that you would like to continue recording the dose."
        />
      );
      break;
  }

  return (
    <ConfirmModal
      open={!!modal}
      onCancel={onClose}
      onConfirm={onConfirm}
      title={title}
      customContent={
        <Content>
          <span>{text}</span>
          {secondaryText && <span>{secondaryText}</span>}
        </Content>
      }
      noteBlockConfirmButton={true}
    />
  );
};
