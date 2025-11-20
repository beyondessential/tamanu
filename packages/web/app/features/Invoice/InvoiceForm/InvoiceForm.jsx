import React from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Plus } from 'lucide-react';
import { Box, Button as MuiButton } from '@material-ui/core';
import { Form, TranslatedText, FormSubmitButton, FormCancelButton } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { FieldArray } from 'formik';
import { isInvoiceEditable } from '@tamanu/shared/utils/invoice';
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

const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 10px 0;
`;

const getDefaultRow = () => ({ id: uuidv4(), quantity: 1 });

export const InvoiceForm = ({ invoice }) => {
  const { ability } = useAuth();
  const canWriteInvoice = ability.can('write', 'Invoice');
  const editable = isInvoiceEditable(invoice) && canWriteInvoice;
  const { mutate: updateInvoice, isLoading: isUpdatingInvoice } = useUpdateInvoice(invoice);

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
  };

  const handleShowErrorDialog = errors => {
    return Object.keys(errors).length === 1 && errors['totalInsurerPercentage'];
  };

  return (
    <Box mb={1}>
      <Form
        suppressErrorDialogCondition={errors => !handleShowErrorDialog(errors)}
        onSubmit={handleSubmit}
        enableReinitialize
        initialValues={{
          invoiceItems: invoice.items?.length ? invoice.items : [editable ? getDefaultRow() : {}],
          insurers: invoice.insurers?.length
            ? invoice.insurers.map(insurer => ({
                ...insurer,
                percentage: insurer.percentage * 100,
              }))
            : [],
        }}
        validationSchema={invoiceFormSchema}
        render={({ submitForm, values, resetForm }) => (
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
                          isDeleteDisabled={values.invoiceItems?.length === 1}
                          showActionMenu={item.productId || values.invoiceItems.length > 1}
                          formArrayMethods={formArrayMethods}
                          editable={editable && canWriteInvoice}
                          data-testid={`invoiceitemrow-ri5o-${index}`}
                        />
                      );
                    })}
                  </Box>
                  {editable && canWriteInvoice && (
                    <ButtonRow>
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
                      <FormCancelButton
                        style={{ marginLeft: 'auto' }}
                        onClick={() => {
                          resetForm();
                        }}
                      >
                        Cancel
                      </FormCancelButton>
                      <SubmitButton onSubmit={submitForm} disabled={isUpdatingInvoice}>
                        <TranslatedText
                          stringId="invoice.form.action.save"
                          fallback="Save item/s"
                          data-testid="translatedtext-26ji"
                        />
                      </SubmitButton>
                    </ButtonRow>
                  )}
                </>
              );
            }}
          </FieldArray>
        )}
      />
    </Box>
  );
};
