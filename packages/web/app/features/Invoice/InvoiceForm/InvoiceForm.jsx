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
import { CELL_WIDTHS, CELL_WIDTHS_EDITABLE, INVOICE_FORM_TYPE } from '../constants';
import { InvoiceItemRow } from './InvoiceItem';
import { InvoiceItemHeader } from './InvoiceItemHeader';
import {
  useUpdateInvoice,
  useUpdateInvoiceItemApproval,
} from '../../../api/mutations/useInvoiceMutation';
import { useAuth } from '../../../contexts/Auth';
import { invoiceFormSchema } from './invoiceFormSchema';
import { INVOICE_MODAL_TYPES } from '../../../constants';

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

const EditModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: 40px -40px 0;
  padding: 30px 40px 0;
  border-top: 1px solid ${Colors.outline};
`;

const FormFooter = styled.div`
  background: white;
  padding: 8px 4px 2px;
  border-radius: 3px;
`;

const getDefaultRow = () => ({ id: uuidv4(), quantity: 1, orderDate: getCurrentDateString() });

export const InvoiceForm = ({ invoice, invoiceFormType, onClose, setInvoiceModalType }) => {
  const { ability } = useAuth();
  const isEditForm = invoiceFormType === INVOICE_FORM_TYPE.EDIT_ITEMS;
  const isReadOnlyForm = invoiceFormType === INVOICE_FORM_TYPE.READ_ONLY;
  const isAddForm = invoiceFormType === INVOICE_FORM_TYPE.ADD_ITEMS;

  const cellWidths = isReadOnlyForm ? CELL_WIDTHS : CELL_WIDTHS_EDITABLE;

  // inProgressItems is used to re-populate the form with in progress items after the form is updated
  const [inProgressItems, setInProgressItems] = useState(isAddForm ? [getDefaultRow()] : []);
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
    const invoiceItems = isAddForm ? [...(invoice.items ?? []), ...newItems] : newItems;

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
          if (onClose) {
            onClose();
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
          if (onClose) {
            onClose();
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
        invoiceItems: isAddForm ? inProgressItems : [...(invoice.items ?? []), ...inProgressItems],
        insurers: invoice.insurers?.length
          ? invoice.insurers.map(insurer => ({
              ...insurer,
              percentage: insurer.percentage * 100,
            }))
          : [],
      }}
      validationSchema={invoiceFormSchema}
      render={({ submitForm, values }) => (
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
                        onUpdateInvoice={handleUpdateItem}
                        onUpdateApproval={updateItemApproval}
                        isFinalised={isFinalised}
                        isCancelled={isCancelled}
                        cellWidths={cellWidths}
                        isEditing={isAddForm || isEditForm}
                      />
                    );
                  })}
                </Box>
                {editable && (isReadOnlyForm || isAddForm) && (
                  <FormFooter>
                    <AddButton
                      variant="text"
                      onClick={() => {
                        if (isReadOnlyForm) {
                          setInvoiceModalType(INVOICE_MODAL_TYPES.ADD_ITEMS);
                        } else {
                          formArrayMethods.push(getDefaultRow());
                        }
                      }}
                      startIcon={<Plus />}
                    >
                      <TranslatedText
                        stringId="invoice.form.action.addItem"
                        fallback="Add item"
                        data-testid="translatedtext-9vs0"
                      />
                    </AddButton>
                  </FormFooter>
                )}
                {editable && (isEditForm || isAddForm) && (
                  <EditModalFooter>
                    <FormCancelButton
                      style={{ marginRight: 8 }}
                      onClick={() => {
                        setInProgressItems([]);
                        if (onClose) onClose();
                      }}
                    >
                      Cancel
                    </FormCancelButton>
                    <SubmitButton onSubmit={submitForm} disabled={isUpdatingInvoice}>
                      {isAddForm ? (
                        <TranslatedText stringId="invoice.form.action.save" fallback="Save" />
                      ) : (
                        <TranslatedText
                          stringId="invoice.form.action.saveChanges"
                          fallback="Save changes"
                        />
                      )}
                    </SubmitButton>
                  </EditModalFooter>
                )}
              </>
            );
          }}
        </FieldArray>
      )}
    />
  );
};
