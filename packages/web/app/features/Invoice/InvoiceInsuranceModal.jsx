import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { useSuggester } from '@tamanu/ui-components';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalActionRow } from '../../components/ModalActionRow';
import { useInvoiceInsurancePlansMutation } from '../../api/mutations/useInvoiceMutation';
import { MultiAutocompleteInput } from '../../components/Field';

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
  const defaultValues = invoice?.insurancePlans?.map(({ id }) => id) || [];
  const [selectedPlans, setSelectedPlans] = useState(defaultValues);
  const insurancePlanSuggester = useSuggester('invoiceInsurancePlan');

  const { mutate } = useInvoiceInsurancePlansMutation(invoice.id, invoice.encounterId);

  const onConfirm = async () => {
    const data = { invoiceInsurancePlanIds: selectedPlans };
    mutate(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

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
        <MultiAutocompleteInput
          name="insurancePlans"
          label={
            <TranslatedText
              stringId="invoice.modal.insurancePlans.label"
              fallback="Insurance plans"
            />
          }
          value={selectedPlans}
          onChange={({ target }) => setSelectedPlans(target.value)}
          suggester={insurancePlanSuggester}
        />
      </ModalBody>
      <ModalActionRow onConfirm={onConfirm} onCancel={onClose} />
    </StyledModal>
  );
};
