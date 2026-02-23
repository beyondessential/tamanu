import React, { useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Plus } from 'lucide-react';
import { FieldArray } from 'formik';
import { Box, Button as MuiButton } from '@material-ui/core';

import { Form, TranslatedText, FormSubmitButton, FormCancelButton } from '@tamanu/ui-components';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { isInvoiceEditable } from '@tamanu/utils/invoice';

import { Colors } from '../../../constants/styles';
import { CELL_WIDTHS, CELL_WIDTHS_EDITABLE } from '../constants';
import { InvoiceItemRow } from './InvoiceItem';
import { InvoiceItemHeader } from './InvoiceItemHeader';
import {
  useUpdateInvoice,
  useUpdateInvoiceItemApproval,
} from '../../../api/mutations/useInvoiceMutation';
import { useAuth } from '../../../contexts/Auth';
import { invoiceFormSchema } from './invoiceFormSchema';

const AddButton = styled(MuiButton)`
  font-size: 14px;
  text-transform: none;
  color: ${Colors.primary};
  position: relative;
  top: -2px;

  .MuiButton-startIcon {
    width: 18px;
    position: relative;
    margin-right: 1px;
  }
`;

const SubmitButton = styled(FormSubmitButton)`
  &.Mui-disabled {
    color: ${Colors.white};
    background-color: ${Colors.primary};
    opacity: 0.3;
  }
`;

const FormFooter = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
`;

const EditModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: 40px -40px 0;
  padding: 20px 40px 0;
  border-top: 1px solid ${Colors.outline};
`;

const getDefaultRow = () => ({ id: uuidv4(), quantity: 1, orderDate: getCurrentDateString() });

const ModalActions = ({ handleSubmit, handleCancel, isDisabled, saveStringId, saveFallback }) => (
  <>
    <FormCancelButton style={{ marginRight: 8 }} onClick={handleCancel}>
      Cancel
    </FormCancelButton>
    <SubmitButton onSubmit={handleSubmit} disabled={isDisabled}>
      <TranslatedText stringId={saveStringId} fallback={saveFallback} />
    </SubmitButton>
  </>
);

const AddItemsActions = ({ handleSubmit, handleCancel, isDisabled }) => (
  <Box textAlign="right" mb={1}>
    <FormCancelButton style={{ marginRight: 8 }} onClick={handleCancel}>
      Cancel
    </FormCancelButton>
    <SubmitButton onSubmit={handleSubmit} disabled={isDisabled}>
      <TranslatedText
        stringId="invoice.form.action.save"
        fallback="Save item/s"
        data-testid="translatedtext-26ji"
      />
    </SubmitButton>
  </Box>
);

export const InvoiceForm = ({
  invoice,
  isEditing,
  setIsEditing,
  onSave,
  onCancel,
  isModal,
  onAddItem,
  startWithBlankRow,
}) => {
  const { ability } = useAuth();
  const cellWidths = isModal || isEditing ? CELL_WIDTHS_EDITABLE : CELL_WIDTHS;

  // inProgressItems is used to re-populate the form with in progress items after the form is updated
  const [inProgressItems, setInProgressItems] = useState(
    startWithBlankRow ? [getDefaultRow()] : [],
  );
  const canWriteInvoice = ability.can('write', 'Invoice');
  const editable = isInvoiceEditable(invoice) && canWriteInvoice;
  const isFinalised = invoice.status === INVOICE_STATUSES.FINALISED;
  const isCancelled = invoice.status === INVOICE_STATUSES.CANCELLED;
  const { mutate: updateInvoice, isLoading: isUpdatingInvoice } = useUpdateInvoice(invoice);
  const { mutate: updateItemApproval } = useUpdateInvoiceItemApproval(invoice);

  // Main submit action for the invoice
  const handleSubmit = async data => {
    const newItems = data.invoiceItems.filter(item => !!item.productId);
    // In add modal mode, merge new items with existing ones rather than replacing
    const invoiceItems = startWithBlankRow ? [...(invoice.items ?? []), ...newItems] : newItems;

    updateInvoice(
      {
        ...invoice,
        items: invoiceItems,
        insurers: data.insurers.map(insurer => ({
          ...insurer,
          percentage: insurer.percentage / 100,
        })),
      },
      {
        onSuccess: () => {
          setInProgressItems([]);
          setIsEditing(false);
          if (onSave) {
            onSave();
          }
        },
      },
    );
  };

  // Used for invoice item actions
  const handleUpdateItem = async data => {
    const itemsToSave = data.invoiceItems.filter(item => !!item.product?.id);
    const inProgressItems = data.invoiceItems.filter(item => !item.product?.id);

    setInProgressItems(inProgressItems);

    updateInvoice(
      {
        ...invoice,
        items: itemsToSave,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          if (onSave) {
            onSave();
          }
        },
      },
    );
  };

  const handleShowErrorDialog = errors => {
    return Object.keys(errors).length === 1 && errors['totalInsurerPercentage'];
  };

  return (
    <Form
      suppressErrorDialogCondition={errors => !handleShowErrorDialog(errors)}
      onSubmit={handleSubmit}
      enableReinitialize
      initialValues={{
        invoiceItems: startWithBlankRow
          ? inProgressItems
          : [...(invoice.items ?? []), ...inProgressItems],
        insurers: invoice.insurers?.length
          ? invoice.insurers.map(insurer => ({
              ...insurer,
              percentage: insurer.percentage * 100,
            }))
          : [],
      }}
      validationSchema={invoiceFormSchema}
      render={({ submitForm, values, resetForm, dirty }) => (
        <Box mb={isModal || isEditing ? 0 : 1}>
          <FieldArray name="invoiceItems">
            {formArrayMethods => {
              return (
                <>
                  <InvoiceItemHeader cellWidths={cellWidths} />
                  <Box>
                    {values.invoiceItems?.map((item, index) => {
                      return (
                        <InvoiceItemRow
                          key={item.id}
                          index={index}
                          item={item}
                          encounterId={invoice.encounterId}
                          priceListId={invoice.priceList?.id}
                          formArrayMethods={formArrayMethods}
                          invoiceIsEditable={editable && canWriteInvoice}
                          isEditing={isEditing}
                          onUpdateInvoice={handleUpdateItem}
                          onUpdateApproval={updateItemApproval}
                          isFinalised={isFinalised}
                          isCancelled={isCancelled}
                          cellWidths={cellWidths}
                        />
                      );
                    })}
                  </Box>
                  {editable && canWriteInvoice && !isEditing && !isModal && (
                    <FormFooter>
                      <Box>
                        <AddButton
                          variant="text"
                          onClick={() =>
                            onAddItem ? onAddItem() : formArrayMethods.push(getDefaultRow())
                          }
                          startIcon={<Plus />}
                        >
                          <TranslatedText
                            stringId="invoice.form.action.addItem"
                            fallback="Add item"
                            data-testid="translatedtext-9vs0"
                          />
                        </AddButton>
                      </Box>
                      <Box>
                        {(dirty || inProgressItems.length > 0) && (
                          <AddItemsActions
                            handleSubmit={submitForm}
                            handleCancel={resetForm}
                            isDisabled={isUpdatingInvoice}
                          />
                        )}
                      </Box>
                    </FormFooter>
                  )}
                  {editable && canWriteInvoice && !isEditing && isModal && (
                    <>
                      <Box px={1} pb={1}>
                        <AddButton
                          variant="text"
                          onClick={() => formArrayMethods.push(getDefaultRow())}
                          startIcon={<Plus />}
                        >
                          <TranslatedText
                            stringId="invoice.form.action.addItem"
                            fallback="Add item"
                            data-testid="translatedtext-9vs0"
                          />
                        </AddButton>
                      </Box>
                      <EditModalFooter>
                        <ModalActions
                          handleSubmit={submitForm}
                          handleCancel={() => {
                            setInProgressItems([]);
                            if (onSave) onSave();
                          }}
                          isDisabled={isUpdatingInvoice}
                          saveStringId="invoice.form.action.save"
                          saveFallback="Save"
                        />
                      </EditModalFooter>
                    </>
                  )}
                  {editable && canWriteInvoice && isEditing && (
                    <EditModalFooter>
                      <ModalActions
                        handleSubmit={submitForm}
                        handleCancel={() => {
                          resetForm();
                          if (onCancel) onCancel();
                        }}
                        isDisabled={isUpdatingInvoice}
                        saveStringId="invoice.form.action.saveChanges"
                        saveFallback="Save changes"
                      />
                    </EditModalFooter>
                  )}
                </>
              );
            }}
          </FieldArray>
        </Box>
      )}
    />
  );
};
