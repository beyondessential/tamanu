import React, { useState } from 'react';
import styled from 'styled-components';
import { Divider, FormControlLabel, Radio, RadioGroup } from '@material-ui/core';
import { ConfirmCancelRow, Modal, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants';
import { BodyText, Heading5, SmallBodyText } from '../../../components';
import { InvoiceDiscountAssessmentForm } from './InvoiceDiscountAssessmentForm';
import { InvoiceDiscountManualForm } from './InvoiceDiscountManualForm';

const DISCOUNT_TYPES = {
  ASSESSMENT: 'assessment',
  MANUAL: 'manual',
};

const STEPS = {
  SELECT: 'select',
  FORM: 'form',
};

const StyledFormControlLabel = styled(FormControlLabel)`
  align-items: flex-start;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  flex: 1;
  padding: 16px 15px;
  margin: 0;
  text-wrap: auto;
  ${p => (p.checked ? `border: 1px solid ${Colors.primary};` : '')}

  &.MuiFormControlLabel-root {
    justify-content: space-between;
  }

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

const DiscountTypeSelection = ({ discountType, setDiscountType, onClose, onNext }) => (
  <>
    <BodyText color="textSecondary" pt="22px" pb="24px">
      <TranslatedText
        stringId="invoice.modal.discountType.description"
        fallback="Select your discount type"
      />
    </BodyText>
    <StyledRadioGroup
      name="discount-type"
      value={discountType}
      onChange={e => setDiscountType(e.target.value)}
    >
      <StyledFormControlLabel
        labelPlacement="start"
        value={DISCOUNT_TYPES.ASSESSMENT}
        checked={discountType === DISCOUNT_TYPES.ASSESSMENT}
        label={
          <RadioLabel
            title={
              <TranslatedText
                stringId="invoice.modal.discountType.assessment.label"
                fallback="Assessment"
              />
            }
            description={
              <TranslatedText
                stringId="invoice.modal.discountType.assessment.description"
                fallback="Complete a patient discount assessment"
              />
            }
          />
        }
        control={<Radio color="primary" size="small" />}
      />
      <StyledFormControlLabel
        labelPlacement="start"
        value={DISCOUNT_TYPES.MANUAL}
        checked={discountType === DISCOUNT_TYPES.MANUAL}
        label={
          <RadioLabel
            title={
              <TranslatedText
                stringId="invoice.modal.discountType.manual.label"
                fallback="Manual"
              />
            }
            description={
              <TranslatedText
                stringId="invoice.modal.discountType.manual.description"
                fallback="Set the patient discount manually"
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
        <TranslatedText stringId="general.action.next" fallback="Next" />
      }
      onConfirm={onNext}
      onCancel={onClose}
    />
  </>
);

export const InvoiceDiscountModal = ({ open, onClose, handleUpdateDiscount }) => {
  const [step, setStep] = useState(STEPS.SELECT);
  const [discountType, setDiscountType] = useState(DISCOUNT_TYPES.ASSESSMENT);

  const resetState = () => {
    setStep(STEPS.SELECT);
    setDiscountType(DISCOUNT_TYPES.ASSESSMENT);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmitDiscount = async discount => {
    await handleUpdateDiscount(discount);
    resetState();
  };

  const handleBack = () => setStep(STEPS.SELECT);

  return (
    <Modal
      width="sm"
      title={
        <TranslatedText
          stringId="invoice.action.applySlidingFeeScale"
          fallback="Apply sliding fee scale"
        />
      }
      open={open}
      onClose={handleClose}
    >
      {step === STEPS.SELECT && (
        <DiscountTypeSelection
          discountType={discountType}
          setDiscountType={setDiscountType}
          onClose={handleClose}
          onNext={() => setStep(STEPS.FORM)}
        />
      )}
      {step === STEPS.FORM && discountType === DISCOUNT_TYPES.ASSESSMENT && (
        <InvoiceDiscountAssessmentForm
          onClose={handleClose}
          onBack={handleBack}
          handleUpdateDiscount={handleSubmitDiscount}
        />
      )}
      {step === STEPS.FORM && discountType === DISCOUNT_TYPES.MANUAL && (
        <InvoiceDiscountManualForm
          onClose={handleClose}
          onBack={handleBack}
          handleUpdateDiscount={handleSubmitDiscount}
        />
      )}
    </Modal>
  );
};
