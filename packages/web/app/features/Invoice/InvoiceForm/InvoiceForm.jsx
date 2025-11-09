import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { Box, CircularProgress, Divider } from '@material-ui/core';
import PrintIcon from '@material-ui/icons/Print';
import { Form, Button, FormSubmitCancelRow, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { FieldArray } from 'formik';
import { isInvoiceEditable } from '@tamanu/shared/utils/invoice';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { InvoiceItemHeader, InvoiceItemRow } from './InvoiceItem';
import { useUpdateInvoice } from '../../../api/mutations/useInvoiceMutation';
import { InvoiceRecordModal } from '../../../components/PatientPrinting/modals/InvoiceRecordModal';
import { useAuth } from '../../../contexts/Auth';
import { invoiceFormSchema } from './invoiceFormSchema';

const LinkText = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.primary};
  cursor: pointer;
  width: fit-content;
`;

const FormContainer = styled.div`
  //padding: 34px 40px;
`;

const StyledDivider = styled(Divider)`
  margin: 26px -40px 32px -40px;
`;

const PrintButton = styled(Button)`
  position: absolute;
  right: 70px;
`;

const getDefaultRow = () => ({ id: uuidv4(), quantity: 1 });

export const InvoiceForm = ({ invoice, isPatientView }) => {
  console.log('invoice', invoice);
  const { ability } = useAuth();
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const canWriteInvoice = ability.can('write', 'Invoice');
  const canDeleteInvoice = ability.can('delete', 'Invoice');
  const editable = isInvoiceEditable(invoice) && canWriteInvoice;
  const cancelable =
    invoice.status === INVOICE_STATUSES.IN_PROGRESS && isPatientView && canWriteInvoice;
  const finalisable =
    invoice.status === INVOICE_STATUSES.IN_PROGRESS &&
    !!invoice.encounter?.endDate &&
    isPatientView &&
    canWriteInvoice;
  const deletable =
    invoice.status !== INVOICE_STATUSES.FINALISED && isPatientView && canDeleteInvoice;

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
    <>
      <Box>
        {isPatientView && !editable && (
          <PrintButton
            onClick={() => setPrintModalOpen(true)}
            color="primary"
            variant="outlined"
            startIcon={<PrintIcon data-testid="printicon-700j" />}
            size="small"
            data-testid="printbutton-7m03"
          >
            <TranslatedText
              stringId="general.action.print"
              fallback="Print"
              data-testid="translatedtext-oqyn"
            />
          </PrintButton>
        )}
        {printModalOpen && (
          <InvoiceRecordModal
            open
            onClose={() => setPrintModalOpen(false)}
            invoice={invoice}
            data-testid="invoicerecordmodal-ep8b"
          />
        )}
      </Box>
      {(finalisable || cancelable || deletable) && (
        <>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            paddingX="36px"
            marginBottom="-16px"
            data-testid="box-bf9z"
          ></Box>
          {finalisable && (
            <Divider
              style={{
                margin: '30px 36px -15px 36px',
              }}
              data-testid="divider-x5gi"
            />
          )}
        </>
      )}
      <Form
        suppressErrorDialogCondition={errors => !handleShowErrorDialog(errors)}
        onSubmit={handleSubmit}
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
        render={({ submitForm, values }) => (
          <FieldArray name="invoiceItems">
            {formArrayMethods => {
              return (
                <FormContainer>
                  <InvoiceItemHeader data-testid="invoiceitemheader-dhmx" />
                  <Box paddingBottom="10px">
                    {values.invoiceItems?.map((item, index) => (
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
                    ))}
                  </Box>
                  {editable && canWriteInvoice && (
                    <LinkText
                      onClick={() => formArrayMethods.push(getDefaultRow())}
                      data-testid="linktext-v8q2"
                    >
                      {'+ '}
                      <TranslatedText
                        stringId="invoice.modal.editInvoice.action.newRow"
                        fallback="Add new row"
                        data-testid="translatedtext-9vs0"
                      />
                    </LinkText>
                  )}
                  {/*<ModalSection>*/}
                  {/*<Box sx={{ flex: 2 }}>*/}
                  {/*  <PatientPaymentsTable invoice={invoice} />*/}
                  {/*  <InsurerPaymentsTable invoice={invoice} />*/}
                  {/*</Box>*/}
                  {/*<InvoiceSummaryPanel*/}
                  {/*  invoice={{ ...invoice, items: values.invoiceItems }}*/}
                  {/*  editable={editable && canWriteInvoice}*/}
                  {/*  handleEditDiscount={handleEditDiscount}*/}
                  {/*  data-testid="invoicesummarypanel-kin9"*/}
                  {/*/>*/}
                  {/*</ModalSection>*/}
                  <FormSubmitCancelRow
                    confirmText={
                      !isUpdatingInvoice ? (
                        editable && canWriteInvoice ? (
                          <TranslatedText
                            stringId="general.action.save"
                            fallback="Save"
                            data-testid="translatedtext-26ji"
                          />
                        ) : (
                          <TranslatedText
                            stringId="general.action.close"
                            fallback="Close"
                            data-testid="translatedtext-qol5"
                          />
                        )
                      ) : (
                        <CircularProgress
                          size={14}
                          color={Colors.white}
                          data-testid="circularprogress-b1j8"
                        />
                      )
                    }
                    onConfirm={submitForm}
                    onCancel={() => {
                      console.log('close');
                    }}
                    confirmDisabled={isUpdatingInvoice}
                    confirmStyle={css`
                      &.Mui-disabled {
                        color: ${Colors.white};
                        background-color: ${Colors.primary};
                        opacity: 0.3;
                      }
                    `}
                    data-testid="formsubmitcancelrow-9g6q"
                  />
                </FormContainer>
              );
            }}
          </FieldArray>
        )}
        data-testid="form-6f50"
      />
    </>
  );
};
