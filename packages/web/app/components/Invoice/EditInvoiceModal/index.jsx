import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import { Box, CircularProgress, Divider } from '@material-ui/core';
import PrintIcon from '@material-ui/icons/Print';
import { Form, Button, FormSubmitCancelRow, Modal, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { FieldArray } from 'formik';
import { isInvoiceEditable } from '@tamanu/shared/utils/invoice';
import { INVOICE_STATUSES } from '@tamanu/constants';

import { InvoiceItemHeader, InvoiceItemRow } from './InvoiceItem';
import { InvoiceStatus } from '../InvoiceStatus';
import { InvoiceSummaryPanel } from '../InvoiceSummaryPanel';
import { useUpdateInvoice } from '../../../api/mutations/useInvoiceMutation';
import { ThreeDotMenu } from '../../ThreeDotMenu';
import { PotentialInvoiceItemsTable } from './PotentialInvoiceItemsTable';
import { InvoiceRecordModal } from '../../PatientPrinting/modals/InvoiceRecordModal';
import { PaymentTablesGroup } from './PaymentTablesGroup';
import { useAuth } from '../../../contexts/Auth';
import { NoteModalActionBlocker } from '../../NoteModalActionBlocker';

const LinkText = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.primary};
  cursor: pointer;
  width: fit-content;
`;

const FormContainer = styled.div`
  padding: 34px 40px;
`;

const StyledDivider = styled(Divider)`
  margin: 26px -40px 32px -40px;
`;

const ModalSection = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding-top: 10px;
`;

const StatusContainer = styled.span`
  margin-left: 20px;
  font-weight: 400;
`;

const PrintButton = styled(Button)`
  position: absolute;
  right: 70px;
`;

const getDefaultRow = () => ({ id: uuidv4(), quantity: 1 });

export const EditInvoiceModal = ({
  open,
  onClose,
  invoice,
  handleEditDiscount,
  handleCancelInvoice,
  handleFinaliseInvoice,
  handleDeleteInvoice,
  isPatientView,
}) => {
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
        onSuccess: onClose,
      },
    );
  };

  const handleShowErrorDialog = errors => {
    return Object.keys(errors).length === 1 && errors['totalInsurerPercentage'];
  };

  const schema = yup.object({
    invoiceItems: yup.array(
      yup.object().shape(
        {
          orderDate: yup.string().when(['productId', 'orderedByUserId'], {
            is: (productId, orderedByUserId) => productId || orderedByUserId,
            then: yup
              .string()
              .required(
                <TranslatedText
                  stringId="validation.required.inline"
                  fallback="*Required"
                  data-testid="translatedtext-8g9w"
                />,
              ),
            otherwise: yup.string(),
          }),
          productId: yup.string().when(['orderDate', 'orderedByUserId'], {
            is: (orderDate, orderedByUserId) => orderDate || orderedByUserId,
            then: yup
              .string()
              .required(
                <TranslatedText
                  stringId="validation.required.inline"
                  fallback="*Required"
                  data-testid="translatedtext-wff4"
                />,
              ),
            otherwise: yup.string(),
          }),
          orderedByUserId: yup.string().when(['orderDate', 'productId'], {
            is: (orderDate, productId) => orderDate || productId,
            then: yup
              .string()
              .required(
                <TranslatedText
                  stringId="validation.required.inline"
                  fallback="*Required"
                  data-testid="translatedtext-dz1y"
                />,
              ),
            otherwise: yup.string(),
          }),
          quantity: yup
            .number()
            .required(
              <TranslatedText
                stringId="general.required"
                fallback="Required"
                data-testid="translatedtext-029d"
              />,
            ),
          productPrice: yup.number(),
        },
        [
          ['orderDate', 'productId'],
          ['productId', 'orderedByUserId'],
          ['orderDate', 'orderedByUserId'],
        ],
      ),
    ),
    insurers: yup.array(
      yup.object({
        insurerId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="invoice.modal.editInvoice.insurer.label"
              fallback="Insurer"
              data-testid="translatedtext-ufad"
            />,
          ),
        percentage: yup
          .number()
          .required(
            <TranslatedText
              stringId="general.required"
              fallback="Required"
              data-testid="translatedtext-vh20"
            />,
          ),
      }),
    ),
    totalInsurerPercentage: yup
      .mixed()
      .test(
        'totalInsurerPercentage',
        <TranslatedText
          stringId="invoice.modal.editInvoice.insurer.totalPercentageError"
          fallback="Total insurer percentage must be less than or equal to 100%"
          data-testid="translatedtext-ddnm"
        />,
        function(_, context) {
          return (
            context.parent.insurers.reduce((acc, curr) => acc + curr.percentage || 0, 0) <= 100
          );
        },
      ),
  });

  const renderDataTables = (values, formArrayMethods) => {
    if (editable) {
      return (
        canWriteInvoice && (
          <PotentialInvoiceItemsTable
            invoice={invoice}
            invoiceItems={values.invoiceItems}
            formArrayMethods={formArrayMethods}
            data-testid="potentialinvoiceitemstable-7w6m"
          />
        )
      );
    }
    return <PaymentTablesGroup invoice={invoice} data-testid="paymenttablesgroup-bdmf" />;
  };

  return (
    <Modal
      width="lg"
      title={
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
          data-testid="box-8k4x"
        >
          <Box display="flex" alignItems="center" flex={1} data-testid="box-ju8n">
            <TranslatedText
              stringId="invoice.modal.view.title"
              fallback="Invoice number: :invoiceNumber"
              replacements={{ invoiceNumber: invoice.displayId }}
              data-testid="translatedtext-8v3p"
            />
            <StatusContainer data-testid="statuscontainer-ns5o">
              <InvoiceStatus status={invoice.status} data-testid="invoicestatus-rk2s" />
            </StatusContainer>
          </Box>
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
      }
      open={open}
      onClose={onClose}
      overrideContentPadding
      data-testid="modal-4e1e"
    >
      <>
        {(finalisable || cancelable || deletable) && (
          <>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              paddingX="36px"
              marginBottom="-16px"
              data-testid="box-bf9z"
            >
              {finalisable && (
                <NoteModalActionBlocker>
                  <Button onClick={handleFinaliseInvoice} data-testid="button-yicz">
                    <TranslatedText
                      stringId="invoice.modal.finaliseButton.label"
                      fallback="Finalise invoice"
                      data-testid="translatedtext-upzu"
                    />
                  </Button>
                </NoteModalActionBlocker>
              )}
              {(cancelable || deletable) && (
                <ThreeDotMenu
                  items={[
                    {
                      label: (
                        <TranslatedText
                          stringId="invoice.modal.editInvoice.cancelInvoice"
                          fallback="Cancel invoice"
                          data-testid="translatedtext-agjc"
                        />
                      ),
                      onClick: handleCancelInvoice,
                      hidden: !cancelable,
                    },
                    {
                      label: (
                        <TranslatedText
                          stringId="invoice.modal.editInvoice.deleteInvoice"
                          fallback="Delete invoice"
                          data-testid="translatedtext-o4n6"
                        />
                      ),
                      onClick: handleDeleteInvoice,
                      hidden: !deletable,
                    },
                  ]}
                  data-testid="threedotmenu-4xaq"
                />
              )}
            </Box>
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
          validationSchema={schema}
          render={({ submitForm, values }) => (
            <FieldArray name="invoiceItems" data-testid="fieldarray-3xyn">
              {formArrayMethods => {
                return (
                  <FormContainer data-testid="formcontainer-fssp">
                    <InvoiceItemHeader data-testid="invoiceitemheader-dhmx" />
                    <Box paddingBottom="10px" data-testid="box-wvt7">
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
                    <ModalSection data-testid="modalsection-42ld">
                      {renderDataTables(values, formArrayMethods)}
                      <InvoiceSummaryPanel
                        invoice={{ ...invoice, items: values.invoiceItems }}
                        editable={editable && canWriteInvoice}
                        handleEditDiscount={handleEditDiscount}
                        data-testid="invoicesummarypanel-kin9"
                      />
                    </ModalSection>
                    <StyledDivider data-testid="styleddivider-w87c" />
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
                      onConfirm={editable && canWriteInvoice ? submitForm : onClose}
                      onCancel={editable && canWriteInvoice ? onClose : undefined}
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
    </Modal>
  );
};
