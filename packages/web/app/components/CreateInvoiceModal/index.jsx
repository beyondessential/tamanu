import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Divider, FormControlLabel, Radio, RadioGroup, useRadioGroup } from '@material-ui/core';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../Modal';
import { TranslatedText } from '../Translation';
import { BodyText, Heading3, Heading5, SmallBodyText } from '../Typography';
import { useApi } from '../../api';
import { Colors, INVOICE_ACTIVE_MODALS, INVOICE_ACTIVE_VIEW } from '../../constants';
import { ConfirmCancelBackRow } from '../ButtonRow';
import { InvoiceDiscountAssessmentForm } from './InvoiceDiscountAssessmentForm';
import { InvoiceManualDiscountForm } from './InvoiceManualDiscountForm';
import { useInvoiceModal } from '../../contexts/InvoiceModal';
import { useEncounterInvoiceQuery } from '../../api/queries/useEncounterInvoiceQuery';

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

const CustomFormControlLabel = ({ value, updateDiscountType, ...props }) => {
  const radioGroup = useRadioGroup();

  let checked = false;

  if (radioGroup) {
    checked = radioGroup.value === value;
    updateDiscountType(radioGroup.value);
  }

  return <StyledFormControlLabel checked={checked} value={value} {...props} />
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
    {type === INVOICE_ACTIVE_VIEW.DISCOUNT_ASSESSMENT && <>
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
    {type === INVOICE_ACTIVE_VIEW.MANUAL_DISCOUNT && <>
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

const InvoiceDiscountTypeSelector = ({ updateDiscountType, handleNext, onClose, handleSkip, showSkip }) => {
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
        onBack={showSkip && handleSkip}
        backButtonText={<TranslatedText stringId="general.action.skip" fallback="Skip" />}
      />
    </>
  );
};

export const CreateInvoiceModal = React.memo(
  ({
    open,
    encounterId,
    currentUser
  }) => {
    const [discountType, setDiscountType] = useState('');
    const api = useApi();
    const { activeView, handleActiveView, handleActiveModal } = useInvoiceModal();
    const queryClient = useQueryClient();

    const { data: invoice } = useEncounterInvoiceQuery(encounterId);

    const onChangeDiscountType = useCallback(
      (updatedDiscountType) => setDiscountType(updatedDiscountType),
      []);

    const handleSubmitDiscount = useCallback(
      async data => {
        const percentage = Math.abs(data.percentageChange / (activeView === INVOICE_ACTIVE_VIEW.MANUAL_DISCOUNT ? 100 : 1));
        const payload = {
          discount: {
            reason: activeView === INVOICE_ACTIVE_VIEW.MANUAL_DISCOUNT ? data.reason : "Patient discount applied",
            percentage,
            isManual: activeView === INVOICE_ACTIVE_VIEW.MANUAL_DISCOUNT,
            appliedByUserId: currentUser.id,
            appliedTime: getCurrentDateTimeString()
          }
        };

        if (!invoice) {
          await api.post('invoices', {
            encounterId,
            ...payload
          });
          queryClient.invalidateQueries(['encounterInvoice', encounterId]);
        } else {
          await api.put(
            `invoices/${invoice?.id}`, payload);
        }
        
        handleActiveModal(INVOICE_ACTIVE_MODALS.EDIT_INVOICE);
      },
      [api, activeView],
    );

    const handleSkip = useCallback(async () => {
      await createInvoice();
      handleActiveModal(INVOICE_ACTIVE_MODALS.EDIT_INVOICE);
    }, []);

    const renderActiveView = () => {
      switch (activeView) {
        case INVOICE_ACTIVE_VIEW.DISCOUNT_TYPE:
          return (
            <InvoiceDiscountTypeSelector
              updateDiscountType={onChangeDiscountType}
              handleNext={() => discountType && handleActiveView(discountType)}
              onClose={onClose}
              handleSkip={handleSkip}
              showSkip={!invoice?.id}
            />
          );
        case INVOICE_ACTIVE_VIEW.DISCOUNT_ASSESSMENT:
          return (
            <InvoiceDiscountAssessmentForm
              handleSubmit={handleSubmitDiscount}
              onClose={onClose}
              handleBack={() => handleActiveView(INVOICE_ACTIVE_VIEW.DISCOUNT_TYPE)}
            />
          );
        case INVOICE_ACTIVE_VIEW.MANUAL_DISCOUNT:
          return (
            <InvoiceManualDiscountForm
              handleSubmit={handleSubmitDiscount}
              onClose={onClose}
              handleBack={() => handleActiveView(INVOICE_ACTIVE_VIEW.DISCOUNT_TYPE)}
            />
          );
        default:
          return null;
      }
    };

    const onClose = () => {
      handleActiveModal('');
      handleActiveView(INVOICE_ACTIVE_VIEW.DISCOUNT_TYPE);
    };

    return (
      <Modal
        width="sm"
        title={<TranslatedText stringId="invoice.action.create" fallback="Create invoice" />}
        open={open}
        onClose={onClose}
      >
        {renderActiveView()}
      </Modal>
    );
  },
);
