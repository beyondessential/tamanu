import React from 'react';
import { ConfirmModal } from '../ConfirmModal';
import { TranslatedText } from '../Translation';
import styled from 'styled-components';
import { MAR_WARNING_MODAL } from '../../constants/medication';

const Content = styled.div`
  font-size: 14px;
  text-align: center;
  margin: 78px auto 66px auto;
  max-width: 478px;
`;

export const WarningModal = ({ modal, onClose, onConfirm }) => {
  let title, text;

  switch (modal) {
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
      customContent={<Content>{text}</Content>}
    />
  );
};
