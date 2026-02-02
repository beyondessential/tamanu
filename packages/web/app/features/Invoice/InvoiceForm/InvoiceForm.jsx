import React, { useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Plus } from 'lucide-react';
import { FieldArray } from 'formik';
import { Box, Button as MuiButton } from '@material-ui/core';

import { Form, TranslatedText, FormSubmitButton, FormCancelButton } from '@tamanu/ui-components';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { isInvoiceEditable } from '@tamanu/shared/utils/invoice';

import { Colors } from '../../../constants/styles';
import { InvoiceItemRow } from './InvoiceItem';
import { InvoiceItemHeader } from './InvoiceItemHeader';
import { useUpdateInvoice } from '../../../api/mutations/useInvoiceMutation';
import { useAuth } from '../../../contexts/Auth';
import { invoiceFormSchema } from './invoiceFormSchema';

const AddButton = styled(MuiButton)`
  font-size: 14px;
  text-transform: none;
  color: ${Colors.primary};
  position: relative;
  top: -2px;

  .MuiButton-startIcon {
    width: 20px;
    position: relative;
    top: -2px;
    margin-right: 2px;
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
  margin: 10px 0;
`;

const getDefaultRow = () => ({ id: uuidv4(), quantity: 1, orderDate: getCurrentDateString() });

const EditItemsActions = ({ handleSubmit, handleCancel, isDisabled }) => (
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

export const InvoiceForm = ({ invoice, isEditing, setIsEditing }) => {
  const { ability } = useAuth();

  // inProgressItems is used to re-populate the form with in progress items after the form is updated
  const [inProgressItems, setInProgressItems] = useState([]);
  const canWriteInvoice = ability.can('write', 'Invoice');
  const editable = isInvoiceEditable(invoice) && canWriteInvoice;
  const isFinalised = invoice.status === INVOICE_STATUSES.FINALISED;
  const { mutate: updateInvoice, isLoading: isUpdatingInvoice } = useUpdateInvoice(invoice);

  // Main submit action for the invoice
  const handleSubmit = async data => {
    const invoiceItems = data.invoiceItems.filter(item => !!item.productId);

    updateInvoice({
      ...invoice,
      items: invoiceItems,
      insurers: data.insurers.map(insurer => ({
        ...insurer,
        percentage: insurer.percentage / 100,
      })),
    });
    setInProgressItems([]);
    setIsEditing(false);
  };

  // Used for invoice item actions
  const handleUpdateItem = async data => {
    const itemsToSave = data.invoiceItems.filter(item => !!item.product?.id);
    const inProgressItems = data.invoiceItems.filter(item => !item.product?.id);

    setInProgressItems(inProgressItems);

    updateInvoice({
      ...invoice,
      items: itemsToSave,
    });
    setIsEditing(false);
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
        invoiceItems: invoice.items?.length
          ? [...invoice.items, ...inProgressItems]
          : [editable ? getDefaultRow() : {}],
        insurers: invoice.insurers?.length
          ? invoice.insurers.map(insurer => ({
              ...insurer,
              percentage: insurer.percentage * 100,
            }))
          : [],
      }}
      validationSchema={invoiceFormSchema}
      render={({ submitForm, values, resetForm, dirty }) => (
        <Box mb={1}>
          <FieldArray name="invoiceItems">
            {formArrayMethods => {
              return (
                <>
                  <InvoiceItemHeader />
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
                          isFinalised={isFinalised}
                        />
                      );
                    })}
                  </Box>
                  {editable && canWriteInvoice && (
                    <FormFooter>
                      <Box>
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
                      <Box>
                        {!isEditing && (dirty || inProgressItems.length > 0) && (
                          <AddItemsActions
                            handleSubmit={submitForm}
                            handleCancel={resetForm}
                            isDisabled={isUpdatingInvoice}
                          />
                        )}
                        {isEditing && (
                          <EditItemsActions
                            handleSubmit={submitForm}
                            handleCancel={() => {
                              setIsEditing(false);
                              resetForm();
                            }}
                            isDisabled={isUpdatingInvoice}
                          />
                        )}
                      </Box>
                    </FormFooter>
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
