import React, { useState } from 'react';
import { Modal } from '../../Modal';
import { TranslatedText } from '../../Translation';
import { INVOICE_DISCOUNT_TYPES } from '../../../constants';
import { InvoiceDiscountTypeSelector } from './InvoiceDiscountTypeSelector';
import { InvoiceDiscountAssessmentForm } from './InvoiceDiscountAssessmentForm';
import { InvoiceDiscountManualForm } from './InvoiceDiscountManualForm';
import { useCreateInvoice } from '../../../api/mutations/useInvoiceMutation';
import { useApi } from '../../../api';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { useAuth } from '../../../contexts/Auth';

const ACTIVE_VIEW = {
  DISCOUNT_TYPE_SELECTOR: 'discountTypeSelector',
  DISCOUNT_ASSESSMENT: 'discountAssessment',
  DISCOUNT_MANUAL: 'discountManual',
};

export const UpsertInvoiceModal = ({
  open,
  onClose,
  encounterId,
  invoice,
  onTemporaryUpdate,
  onCreateSuccess,
}) => {
  const { facilityId } = useAuth();
  const api = useApi();
  const isCreating = !invoice?.id;

  const getInitialView = () => {
    if (!invoice?.discount) {
      return ACTIVE_VIEW.DISCOUNT_TYPE_SELECTOR;
    } else if (invoice?.discount?.isManual) {
      setDiscountType(INVOICE_DISCOUNT_TYPES.MANUAL);
      return ACTIVE_VIEW.DISCOUNT_MANUAL;
    } else {
      return ACTIVE_VIEW.DISCOUNT_ASSESSMENT;
    }
  };

  const getInitialDiscountType = () => {
    if (!invoice?.discount) {
      return undefined;
    } else if (invoice?.discount?.isManual) {
      return INVOICE_DISCOUNT_TYPES.MANUAL;
    } else {
      return INVOICE_DISCOUNT_TYPES.ASSESSMENT;
    }
  };

  const { mutate: createInvoice, isLoading } = useCreateInvoice();

  const [discountType, setDiscountType] = useState(getInitialDiscountType);
  const [activeView, setActiveView] = useState(getInitialView);

  const onChangeDiscountType = (_, discountType) => {
    setDiscountType(discountType);
  };

  const handleActiveView = (view) => {
    setActiveView(view);
  };

  const handleUpsertInvoice = (payload) => {
    if (isLoading) {
      return;
    }

    if (isCreating) {
      createInvoice(
        { encounterId, facilityId, date: getCurrentDateTimeString(), ...payload },
        { onSuccess: onCreateSuccess },
      );
    } else {
      onTemporaryUpdate(payload);
      onClose();
    }
  };

  const handleUpsertInvoiceWithDiscount = (data) => {
    const discount = {
      percentage: data.percentage,
      reason: data.reason,
      isManual: discountType === INVOICE_DISCOUNT_TYPES.MANUAL,
      appliedByUser: api?.user,
      appliedTime: new Date(),
    };

    handleUpsertInvoice({ discount });
  };

  const renderActiveView = () => {
    switch (activeView) {
      case ACTIVE_VIEW.DISCOUNT_TYPE_SELECTOR:
        return (
          <InvoiceDiscountTypeSelector
            discountType={discountType}
            onChangeDiscountType={onChangeDiscountType}
            handleNext={() =>
              handleActiveView(
                discountType === INVOICE_DISCOUNT_TYPES.ASSESSMENT
                  ? ACTIVE_VIEW.DISCOUNT_ASSESSMENT
                  : ACTIVE_VIEW.DISCOUNT_MANUAL,
              )
            }
            onClose={onClose}
            handleSkip={isCreating ? () => handleUpsertInvoice() : undefined}
            isSubmitting={isLoading}
          />
        );
      case ACTIVE_VIEW.DISCOUNT_ASSESSMENT:
        return (
          <InvoiceDiscountAssessmentForm
            handleSubmit={handleUpsertInvoiceWithDiscount}
            onClose={onClose}
            handleBack={() => handleActiveView(ACTIVE_VIEW.DISCOUNT_TYPE_SELECTOR)}
            isSubmitting={isLoading}
          />
        );
      case ACTIVE_VIEW.DISCOUNT_MANUAL:
        return (
          <InvoiceDiscountManualForm
            handleSubmit={handleUpsertInvoiceWithDiscount}
            onClose={onClose}
            handleBack={() => handleActiveView(ACTIVE_VIEW.DISCOUNT_TYPE_SELECTOR)}
            isSubmitting={isLoading}
            initialValues={
              invoice?.discount?.isManual
                ? { ...invoice.discount, percentage: invoice.discount.percentage * 100 }
                : undefined
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      width="sm"
      title={
        isCreating ? (
          <TranslatedText stringId="invoice.action.create" fallback="Create invoice" />
        ) : (
          <TranslatedText stringId="invoice.action.update" fallback="Update invoice" />
        )
      }
      open={open}
      onClose={onClose}
    >
      {renderActiveView()}
    </Modal>
  );
};
