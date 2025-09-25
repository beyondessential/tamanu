import React, { useState } from 'react';
import { BodyText, Heading5, SmallBodyText } from '..';
import { PRESCRIPTION_TYPES } from '../../constants';
import styled from 'styled-components';
import { Divider, FormControlLabel, Radio, RadioGroup } from '@material-ui/core';
import { ConfirmCancelRow, Modal, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';

const StyledFormControlLabel = styled(FormControlLabel)`
  align-items: flex-start;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  max-width: 230px;
  padding: 16px 15px;
  margin: 0;
  ${(p) => (p.checked ? `border: 1px solid ${Colors.primary};` : '')}
  .MuiButtonBase-root {
    top: -10px;
    position: relative;
  }
`;

const StyledRadioGroup = styled(RadioGroup)`
  flex-direction: row;
  gap: 25px;
`;

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

const RadioLabel = ({ title, description }) => (
  <>
    <Heading5 mb="7px" mt={0}>
      {title}
    </Heading5>
    <SmallBodyText>{description}</SmallBodyText>
  </>
);

export const PrescriptionTypeModal = ({ open, onClose, onContinue }) => {
  const [selectedPrescriptionType, setSelectedPrescriptionType] = useState(PRESCRIPTION_TYPES.SINGLE_MEDICATION);

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="sm"
      title={
        <TranslatedText
          stringId="medication.modal.prescriptionType.title"
          fallback="Select prescription type"
        />
      }
    >
      <BodyText color={Colors.darkText} pt="22px" pb="24px">
        <TranslatedText
          stringId="medication.modal.prescriptionType.description"
          fallback="Please select whether you would like to create a single medication prescription or multiple prescriptions using a medication set."
        />
      </BodyText>
      <StyledRadioGroup
        name="use-radio-group"
        value={selectedPrescriptionType}
        onChange={(e) => setSelectedPrescriptionType(e.target.value)}
      >
        <StyledFormControlLabel
          labelPlacement="start"
          value={PRESCRIPTION_TYPES.SINGLE_MEDICATION}
          label={
            <RadioLabel
              title={
                <TranslatedText
                  stringId="medication.modal.singleMedication.label"
                  fallback="Single medication"
                />
              }
              description={
                <TranslatedText
                  stringId="medication.modal.singleMedication.description"
                  fallback="Create a prescription for a single medication"
                />
              }
            />
          }
          control={<Radio color="primary" size="small" />}
        />
        <StyledFormControlLabel
          value={PRESCRIPTION_TYPES.MEDICATION_SET}
          labelPlacement="start"
          label={
            <RadioLabel
              title={
                <TranslatedText
                  stringId="medication.modal.medicationSet.label"
                  fallback="Medication set"
                />
              }
              description={
                <TranslatedText
                  stringId="medication.modal.medicationSet.description"
                  fallback="Create multiple prescriptions using a medication set"
                />
              }
            />
          }
          control={<Radio color="primary" size="small" />}
        />
      </StyledRadioGroup>
      <StyledDivider />
      <ConfirmCancelRow
        confirmText={
          <TranslatedText
            stringId="general.action.continue"
            fallback="Continue"
          />
        }
        onConfirm={() => onContinue(selectedPrescriptionType)}
        onCancel={onClose}
      />
    </Modal>
  );
};
