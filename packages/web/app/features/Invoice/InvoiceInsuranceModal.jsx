import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';

import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalActionRow } from '../../components/ModalActionRow';
import { useInvoiceInsurancePlansMutation } from '../../api/mutations/useInvoiceMutation';
import { usePatientInsurancePlansQuery } from '../../api/queries';
import { SuggesterSelectField } from '../../components/Field';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { usePatientNavigation } from '../../utils/usePatientNavigation';

const StyledModal = styled(Modal)`
  .MuiPaper-root,
  .MuiPaper-root > div {
    overflow: visible;
  }
`;

const ModalBody = styled.div`
  margin: 20px 0 50px;

  p {
    font-size: 14px;
    margin-bottom: 16px;
  }
`;

export const InvoiceInsuranceModal = ({ open, onClose, invoice }) => {
  const patientId = invoice.encounter.patientId;
  const defaultValues = invoice?.insurancePlans?.map(({ id }) => id) || [];
  const [selectedPlans, setSelectedPlans] = useState(defaultValues);
  const { mutate } = useInvoiceInsurancePlansMutation(invoice.id, invoice.encounterId);
  const {
    data: insurancePlans = [],
    isLoading: isLoadingInsurancePlans,
  } = usePatientInsurancePlansQuery({ patientId });
  const { navigateToPatient } = usePatientNavigation();
  const onChange = ({ target }) => {
    const value = typeof target.value === 'string' ? JSON.parse(target.value) : target.value;
    setSelectedPlans(value);
  };

  const onConfirm = async () => {
    const data = { invoiceInsurancePlanIds: selectedPlans };
    mutate(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleGoToPatientDetails = () => {
    onClose();
    navigateToPatient(patientId);
  };

  if (isLoadingInsurancePlans) {
    return <LoadingIndicator />;
  }

  if (insurancePlans.length === 0) {
    return (
      <StyledModal
        width="sm"
        title={
          <TranslatedText
            stringId="invoice.modal.insurancePlans.title.noInsurancePlans"
            fallback="No insurance plan recorded"
          />
        }
        open={open}
        onClose={onClose}
      >
        <ModalBody>
          <Typography>
            <TranslatedText
              stringId="invoice.modal.insurancePlans.noInsurancePlans"
              fallback="This patient does not have any insurance plan/s recorded. Please add insurance information in the 'Patient details' section to be able to attach their plan to an invoice."
            />
          </Typography>
        </ModalBody>
        <ModalActionRow
          confirmText={
            <TranslatedText
              stringId="invoice.modal.insurancePlans.goToPatientDetails"
              fallback="Go to patient details"
            />
          }
          cancelText={
            <TranslatedText
              stringId="invoice.modal.insurancePlans.close"
              fallback="Close"
            />
          }
          onConfirm={handleGoToPatientDetails}
          onCancel={onClose}
        />
      </StyledModal>
    );
  }

  return (
    <StyledModal
      width="sm"
      title={
        <TranslatedText stringId="invoice.modal.insurancePlans.title" fallback="Insurance plans" />
      }
      open={open}
      onClose={onClose}
    >
      <ModalBody>
        <Typography>
          <TranslatedText
            stringId="invoice.modal.insurancePlans.text"
            fallback="Select or remove the insurance plans you would like to apply to this patient invoice below."
          />
        </Typography>
        <SuggesterSelectField
          label={
            <TranslatedText
              stringId="invoice.modal.insurancePlans.label"
              fallback="Insurance plans"
            />
          }
          field={{
            name: 'insurancePlans',
            value: selectedPlans,
            onChange,
          }}
          endpoint="invoiceInsurancePlan"
          isMulti
          baseQueryParameters={{ patientId }}
        />
      </ModalBody>
      <ModalActionRow onConfirm={onConfirm} onCancel={onClose} />
    </StyledModal>
  );
};
