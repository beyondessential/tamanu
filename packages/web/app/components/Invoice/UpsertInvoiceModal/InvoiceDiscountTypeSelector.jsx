import React from 'react';
import styled from 'styled-components';
import { Divider, FormControlLabel, Radio, RadioGroup } from '@material-ui/core';
import { TranslatedText } from '../../Translation';
import { BodyText, Heading3, Heading5, SmallBodyText } from '../../Typography';
import { Colors, INVOICE_DISCOUNT_TYPES } from '../../../constants';
import { ConfirmCancelBackRow } from '../../ButtonRow';

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
  gap: 20px;
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

export const InvoiceDiscountTypeSelector = ({
  discountType,
  onChangeDiscountType,
  handleNext,
  onClose,
  handleSkip,
  isSubmitting,
}) => {
  return (
    <>
      <Heading3 mb="8px">
        <TranslatedText
          stringId="invoice.modal.selectDiscount.subtitle"
          fallback="Patient invoice discount"
        />
      </Heading3>
      <BodyText mb="36px" color="textTertiary">
        <TranslatedText
          stringId="invoice.modal.selectDiscount.description"
          fallback="Please select the patient discount type below, otherwise skip this step. You can add the discount again at a later time."
        />
      </BodyText>
      <Heading5 mb="12px" color={Colors.midText}>
        <TranslatedText
          stringId="invoice.modal.selectDiscount.label"
          fallback="Select your discount type"
        />
      </Heading5>
      <StyledRadioGroup name="use-radio-group" value={discountType} onChange={onChangeDiscountType}>
        <StyledFormControlLabel
          labelPlacement="start"
          value={INVOICE_DISCOUNT_TYPES.ASSESSMENT}
          label={
            <RadioLabel
              title={
                <TranslatedText
                  stringId="invoice.modal.selectDiscount.assessment.label"
                  fallback="Assessment"
                />
              }
              description={
                <TranslatedText
                  stringId="invoice.modal.selectDiscount.assessment.subLabel"
                  fallback="Complete a patient discount assessment"
                />
              }
            />
          }
          control={<Radio color="primary" size="small" />}
        />
        <StyledFormControlLabel
          value={INVOICE_DISCOUNT_TYPES.MANUAL}
          labelPlacement="start"
          label={
            <RadioLabel
              title={
                <TranslatedText
                  stringId="invoice.modal.selectDiscount.manual.label"
                  fallback="Manual"
                />
              }
              description={
                <TranslatedText
                  stringId="invoice.modal.selectDiscount.manual.subLabel"
                  fallback="Set the patient discount manually"
                />
              }
            />
          }
          control={<Radio color="primary" size="small" />}
        />
      </StyledRadioGroup>
      <StyledDivider />
      <ConfirmCancelBackRow
        confirmText={<TranslatedText stringId="general.action.next" fallback="Next" />}
        onConfirm={handleNext}
        onCancel={onClose}
        onBack={handleSkip}
        backButtonText={<TranslatedText stringId="general.action.skip" fallback="Skip" />}
        confirmDisabled={!discountType}
        backDisabled={isSubmitting}
      />
    </>
  );
};
