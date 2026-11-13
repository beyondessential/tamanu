import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';

import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalActionRow } from '../../components/ModalActionRow';
import { useInvoiceInsurancePlansMutation } from '../../api/mutations/useInvoiceMutation';
import { usePatientAvailableInsurancePlansQuery } from '../../api/queries';
import { SuggesterSelectField } from '../../components/Field';
import { LoadingIndicator } from '../../components/LoadingIndicator';

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

/**
 * The invoice's insurance plan picker. `onSaved` is given the plans that were applied, so a caller
 * that opened the picker part-way through another action — recording a payment — can decide whether
 * to carry on. `onAddToPatient`, where offered, opens the patient's details to record a plan first.
 */
export const InvoiceInsuranceModal = ({
  open,
  onClose,
  invoice,
  onSaved = () => {},
  onAddToPatient,
}) => {
  const patientId = invoice?.encounter?.patientId;
  const defaultValues = invoice?.insurancePlans?.map(({ id }) => id) || [];
  const [selectedPlans, setSelectedPlans] = useState(defaultValues);
  const { mutate } = useInvoiceInsurancePlansMutation(invoice.id, invoice.encounterId, patientId);
  // The patient's plans that this facility can actually bill against: a patient whose only plans
  // are restricted elsewhere has nothing to pick, so the picker shows its empty state.
  const { data: availablePlans = [], isLoading: isLoadingInsurancePlans } =
    usePatientAvailableInsurancePlansQuery({ patientId });

  const onChange = ({ target }) => {
    const value = typeof target.value === 'string' ? JSON.parse(target.value) : target.value;
    setSelectedPlans(value);
  };

  const onConfirm = async () => {
    const data = { invoiceInsurancePlanIds: selectedPlans };
    mutate(data, {
      onSuccess: () => {
        onClose();
        onSaved(selectedPlans);
      },
    });
  };

  if (isLoadingInsurancePlans) {
    return (
      <StyledModal
        width="sm"
        title={
          <TranslatedText
            stringId="invoice.modal.insurancePlans.title"
            fallback="Insurance plans"
          />
        }
        open={open}
        onClose={onClose}
      >
        <ModalBody>
          <LoadingIndicator />
        </ModalBody>
      </StyledModal>
    );
  }

  if (availablePlans.length === 0 && defaultValues.length === 0) {
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
        {onAddToPatient ? (
          <ModalActionRow
            confirmText={
              <TranslatedText
                stringId="invoice.modal.insurancePlans.goToPatientDetails"
                fallback="Go to patient details"
              />
            }
            cancelText={
              <TranslatedText stringId="invoice.modal.insurancePlans.close" fallback="Close" />
            }
            onConfirm={onAddToPatient}
            onCancel={onClose}
          />
        ) : (
          <ModalActionRow
            confirmText={
              <TranslatedText stringId="invoice.modal.insurancePlans.close" fallback="Close" />
            }
            onConfirm={onClose}
          />
        )}
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
