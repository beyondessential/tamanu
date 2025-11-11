import React from 'react';
import styled from 'styled-components';
import { Divider, FormControlLabel, Radio, RadioGroup } from '@material-ui/core';
import { TranslatedText } from '../../../components/Translation';
import { BodyText, Heading3, Heading5, SmallBodyText } from '../../../components/Typography';
import { INVOICE_DISCOUNT_TYPES } from '../../../constants';
import { ConfirmCancelBackRow } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';

const StyledFormControlLabel = styled(FormControlLabel)`
  align-items: flex-start;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  max-width: 230px;
  padding: 16px 15px;
  margin: 0;
  ${p => (p.checked ? `border: 1px solid ${Colors.primary};` : '')}
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
    <Heading5 mb="7px" mt={0} data-testid="heading5-cr0k">
      {title}
    </Heading5>
    <SmallBodyText data-testid="smallbodytext-kxhh">{description}</SmallBodyText>
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
      <Heading3 mb="8px" data-testid="heading3-3cyl">
        <TranslatedText
          stringId="invoice.modal.selectDiscount.subtitle"
          fallback="Patient invoice discount"
          data-testid="translatedtext-0x6r"
        />
      </Heading3>
      <BodyText mb="36px" color="textTertiary" data-testid="bodytext-sfxy">
        <TranslatedText
          stringId="invoice.modal.selectDiscount.description"
          fallback="Please select the patient discount type below, otherwise skip this step. You can add the discount again at a later time."
          data-testid="translatedtext-0mos"
        />
      </BodyText>
      <Heading5 mb="12px" color={Colors.midText} data-testid="heading5-7pnz">
        <TranslatedText
          stringId="invoice.modal.selectDiscount.label"
          fallback="Select your discount type"
          data-testid="translatedtext-bjng"
        />
      </Heading5>
      <StyledRadioGroup
        name="use-radio-group"
        value={discountType}
        onChange={onChangeDiscountType}
        data-testid="styledradiogroup-ow74"
      >
        <StyledFormControlLabel
          labelPlacement="start"
          value={INVOICE_DISCOUNT_TYPES.ASSESSMENT}
          label={
            <RadioLabel
              title={
                <TranslatedText
                  stringId="invoice.modal.selectDiscount.assessment.label"
                  fallback="Assessment"
                  data-testid="translatedtext-rzia"
                />
              }
              description={
                <TranslatedText
                  stringId="invoice.modal.selectDiscount.assessment.subLabel"
                  fallback="Complete a patient discount assessment"
                  data-testid="translatedtext-np5o"
                />
              }
              data-testid="radiolabel-0lyu"
            />
          }
          control={<Radio color="primary" size="small" data-testid="radio-ypd4" />}
          data-testid="styledformcontrollabel-ik0t"
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
                  data-testid="translatedtext-9fpc"
                />
              }
              description={
                <TranslatedText
                  stringId="invoice.modal.selectDiscount.manual.subLabel"
                  fallback="Set the patient discount manually"
                  data-testid="translatedtext-1fhq"
                />
              }
              data-testid="radiolabel-yjf2"
            />
          }
          control={<Radio color="primary" size="small" data-testid="radio-sw8m" />}
          data-testid="styledformcontrollabel-wzif"
        />
      </StyledRadioGroup>
      <StyledDivider data-testid="styleddivider-1eul" />
      <ConfirmCancelBackRow
        confirmText={
          <TranslatedText
            stringId="general.action.next"
            fallback="Next"
            data-testid="translatedtext-68a7"
          />
        }
        onConfirm={handleNext}
        onCancel={onClose}
        onBack={handleSkip}
        backButtonText={
          <TranslatedText
            stringId="general.action.skip"
            fallback="Skip"
            data-testid="translatedtext-unsx"
          />
        }
        confirmDisabled={!discountType}
        backDisabled={isSubmitting}
        data-testid="confirmcancelbackrow-lawh"
      />
    </>
  );
};
