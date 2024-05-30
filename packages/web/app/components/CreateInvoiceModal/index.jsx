import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Divider, FormControlLabel, Radio, RadioGroup, useRadioGroup } from '@material-ui/core';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import { Modal } from '../Modal';
import { TranslatedText } from '../Translation';
import { BodyText, Heading3, Heading5, SmallBodyText } from '../Typography';
import { useApi } from '../../api';
import { Colors, INVOICE_ACTIVE_MODALS } from '../../constants';
import { ConfirmCancelBackRow } from '../ButtonRow';
import { InvoiceDiscountAssessmentForm } from './InvoiceDiscountAssessmentForm';
import { InvoiceManualDiscountForm } from './InvoiceManualDiscountForm';

const StyledFormControlLabel = styled(FormControlLabel)`
  align-items: flex-start;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  max-width: 230px;
  padding: 16px 15px;
  margin: 0;
  ${p => p.checked ? `border: 1px solid ${Colors.primary};` : ""}
  .MuiButtonBase-root {
    top: -10px;
    position: relative;
  }
`;

const CustomFormControlLabel = ({value, updateDiscountType}) => {
  const radioGroup = useRadioGroup();

  let checked = false;

  if (radioGroup) {
    checked = radioGroup.value === props.value;
    props.updateDiscountType(radioGroup.value);
  }

  return <StyledFormControlLabel checked={checked} {...props} />
};

const StyledRadioGroup = styled(RadioGroup)`
  flex-direction: row;
  gap: 20px;
`;

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

const RadioLabel = ({ type }) => (
  <>
    {type === ACTIVE_VIEW.ASSESSMENT && <>
      <Heading5 mb="7px" mt={0}>
        <TranslatedText
          stringId="invoice.modal.selectDiscount.assessment.label"
          fallback="Assessment"
        />
      </Heading5>
      <SmallBodyText>
        <TranslatedText
          stringId="invoice.modal.selectDiscount.assessment.subLabel"
          fallback="Complete a patient discount assessment"
        />
      </SmallBodyText>
    </>}
    {type === ACTIVE_VIEW.MANUAL && <>
      <Heading5 mb="7px" mt={0}>
        <TranslatedText
          stringId="invoice.modal.selectDiscount.manual.label"
          fallback="Manual"
        />
      </Heading5>
      <SmallBodyText>
        <TranslatedText
          stringId="invoice.modal.selectDiscount.manual.subLabel"
          fallback="Set the patient discount manually"
        />
      </SmallBodyText>
    </>}
  </>
);

const InvoiceDiscountTypeSelector = ({ updateDiscountType, handleNext, onClose, handleSkip }) => {
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
      <StyledRadioGroup name="use-radio-group">
        <CustomFormControlLabel
          labelPlacement="start"
          value="assessment"
          label={<RadioLabel type="assessment" />}
          control={<Radio color='primary' size='small' />}
          updateDiscountType={updateDiscountType}
        />
        <CustomFormControlLabel
          value="manual"
          labelPlacement="start"
          label={<RadioLabel type="manual" />}
          control={<Radio color='primary' size='small' />}
          updateDiscountType={updateDiscountType}
        />
      </StyledRadioGroup>
      <StyledDivider />
      <ConfirmCancelBackRow
        confirmText={<TranslatedText stringId="general.action.next" fallback="Next" />}
        onConfirm={handleNext}
        onCancel={onClose}
        onBack={handleSkip}
        backButtonText={<TranslatedText stringId="general.action.skip" fallback="Skip" />}
      />
    </>
  );
};

const ACTIVE_VIEW = {
  DISCOUNT_TYPE: "discountType",
  DISCOUNT_ASSESSMENT: "assessment",
  MANUAL_DISCOUNT: "manual",
}

export const CreateInvoiceModal = React.memo(
  ({
    open,
    onClose,
    createInvoice,
    handleActiveModal
  }) => {
    const [discountType, setDiscountType] = useState('');
    const [activeView, setActiveView] = useState(ACTIVE_VIEW.DISCOUNT_TYPE);
    const api = useApi();

    const onChangeDiscountType = useCallback(
      (updatedDiscountType) => setDiscountType(updatedDiscountType),
      []);

    const handleActiveView = useCallback((nextActiveView) => {
      setActiveView(nextActiveView);
    }, []);

    const handleSubmitDiscount = useCallback(
      async data => {
        let payload;
        const invoiceResponse = await createInvoice();
        const percentageChange = -Math.abs(data.percentageChange / (activeView === ACTIVE_VIEW.MANUAL_DISCOUNT ? 100 : 1));
      const payload = {
        description: activeView === ACTIVE_VIEW.MANUAL_DISCOUNT ? data.reason : "Patient discount applied",
        percentageChange,
        date: getCurrentDateString(),
      };
        
        await api.post(`invoices/${invoiceResponse.id}/priceChangeItems`, payload);
        handleActiveModal(INVOICE_ACTIVE_MODALS.EDIT_INVOICE);
      },
      [api, activeView],
    );

    const handleSkip = useCallback(async () => {
      await createInvoice();
      handleActiveModal(INVOICE_ACTIVE_MODALS.EDIT_INVOICE);
    }, []);

    return (
      <Modal
        width="sm"
        title={<TranslatedText stringId="invoice.action.create" fallback="Create invoice" />}
        open={open}
        onClose={onClose}
      >
        {activeView === ACTIVE_VIEW.DISCOUNT_TYPE && (
          <InvoiceDiscountTypeSelector
            updateDiscountType={onChangeDiscountType}
            handleNext={() => discountType && handleActiveView(discountType)}
            onClose={onClose}
            handleSkip={handleSkip}
          />
        )}
        {activeView === ACTIVE_VIEW.DISCOUNT_ASSESSMENT && (
          <InvoiceDiscountAssessmentForm 
            handleSubmit={handleSubmitDiscount} 
            onClose={onClose}
            handleBack={() => handleActiveView(ACTIVE_VIEW.DISCOUNT_TYPE)}
          />
        )}
        {activeView === ACTIVE_VIEW.MANUAL_DISCOUNT && (
          <InvoiceManualDiscountForm 
            handleSubmit={handleSubmitDiscount}
            onClose={onClose}
            handleBack={() => handleActiveView(ACTIVE_VIEW.DISCOUNT_TYPE)}
          />
        )}
      </Modal>
    );
  },
);
