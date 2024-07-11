import React, { useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import { Box, CircularProgress, Divider } from '@material-ui/core';
import PrintIcon from '@material-ui/icons/Print';
import { FieldArray } from 'formik';
import { isInvoiceEditable } from '@tamanu/shared/utils/invoice';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { Modal } from '../../Modal';
import { TranslatedText } from '../../Translation';
import { Form } from '../../Field';
import { Colors } from '../../../constants';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { InvoiceItemHeader, InvoiceItemRow } from './InvoiceItem';
import { InvoiceStatus } from '../InvoiceStatus';
import { InvoiceSummaryPanel } from '../InvoiceSummaryPanel';
import { useUpdateInvoice } from '../../../api/mutations/useInvoiceMutation';
import { ThreeDotMenu } from '../../ThreeDotMenu';
import { PotentialInvoiceItemsTable } from './PotentialInvoiceItemsTable';
import { Button } from '../../Button';
import { InvoiceRecordModal } from '../../PatientPrinting/modals/InvoiceRecordModal';
import { PaymentTablesGroup } from './PaymentTablesGroup';
import { useAuth } from '../../../contexts/Auth';

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
  isPatientView,
}) => {
  const { ability } = useAuth();
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const canWriteInvoice = ability.can('write', 'Invoice');
  const editable = isInvoiceEditable(invoice);
  const cancelable =
    invoice.status === INVOICE_STATUSES.IN_PROGRESS && isPatientView && canWriteInvoice;
  const finalisable =
    invoice.status === INVOICE_STATUSES.IN_PROGRESS &&
    !!invoice.encounter?.endDate &&
    isPatientView &&
    canWriteInvoice;

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
              .required()
              .translatedLabel(<TranslatedText stringId="general.date.label" fallback="Date" />),
            otherwise: yup.string(),
          }),
          productId: yup.string().when(['orderDate', 'orderedByUserId'], {
            is: (orderDate, orderedByUserId) => orderDate || orderedByUserId,
            then: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="invoice.modal.editInvoice.details.label"
                  fallback="Details"
                />,
              ),
            otherwise: yup.string(),
          }),
          orderedByUserId: yup.string().when(['orderDate', 'productId'], {
            is: (orderDate, productId) => orderDate || productId,
            then: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="invoice.modal.editInvoice.orderedBy.label"
                  fallback="Ordered by"
                />,
              ),
            otherwise: yup.string(),
          }),
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
            />,
          ),
        percentage: yup
          .number()
          .required(<TranslatedText stringId="general.required" fallback="Required" />),
      }),
    ),
    totalInsurerPercentage: yup
      .mixed()
      .test(
        'totalInsurerPercentage',
        <TranslatedText
          stringId="invoice.modal.editInvoice.insurer.totalPercentageError"
          fallback="Total insurer percentage must be less than or equal to 100%"
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
          />
        )
      );
    }
    return <PaymentTablesGroup invoice={invoice} />;
  };

  return (
    <Modal
      width="lg"
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
          <Box display="flex" alignItems="center" flex={1}>
            <TranslatedText
              stringId="invoice.modal.view.title"
              fallback="Invoice number: :invoiceNumber"
              replacements={{ invoiceNumber: invoice.displayId }}
            />
            <StatusContainer>
              <InvoiceStatus status={invoice.status} />
            </StatusContainer>
          </Box>
          {isPatientView && !editable && (
            <PrintButton
              onClick={() => setPrintModalOpen(true)}
              color="primary"
              variant="outlined"
              startIcon={<PrintIcon />}
              size="small"
            >
              <TranslatedText stringId="general.action.print" fallback="Print" />
            </PrintButton>
          )}
          {printModalOpen && (
            <InvoiceRecordModal open onClose={() => setPrintModalOpen(false)} invoice={invoice} />
          )}
        </Box>
      }
      open={open}
      onClose={onClose}
      overrideContentPadding
    >
      <>
        {(finalisable || cancelable) && (
          <>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              paddingX="36px"
              marginBottom="-16px"
            >
              {finalisable && (
                <Button onClick={handleFinaliseInvoice}>
                  <TranslatedText
                    stringId="invoice.modal.finaliseButton.label"
                    fallback="Finalise invoice"
                  />
                </Button>
              )}
              {cancelable && (
                <ThreeDotMenu
                  items={[
                    {
                      label: (
                        <TranslatedText
                          stringId="invoice.modal.editInvoice.cancelInvoice"
                          fallback="Cancel invoice"
                        />
                      ),
                      onClick: handleCancelInvoice,
                    },
                  ]}
                />
              )}
            </Box>
            {finalisable && (
              <Divider
                style={{
                  margin: '30px 36px -15px 36px',
                }}
              />
            )}
          </>
        )}
        <Form
          suppressErrorDialogCondition={handleShowErrorDialog}
          enableReinitialize
          onSubmit={handleSubmit}
          initialValues={{
            invoiceItems: invoice.items?.length ? invoice.items : [getDefaultRow()],
            insurers: invoice.insurers?.length
              ? invoice.insurers.map(insurer => ({
                  ...insurer,
                  percentage: insurer.percentage * 100,
                }))
              : [],
          }}
          validationSchema={schema}
          render={({ submitForm, values }) => (
            <FieldArray name="invoiceItems">
              {formArrayMethods => {
                return (
                  <FormContainer>
                    <InvoiceItemHeader />
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
                        />
                      ))}
                    </Box>
                    {editable && canWriteInvoice && (
                      <LinkText onClick={() => formArrayMethods.push(getDefaultRow())}>
                        {'+ '}
                        <TranslatedText
                          stringId="invoice.modal.editInvoice.action.newRow"
                          fallback="Add new row"
                        />
                      </LinkText>
                    )}
                    <ModalSection>
                      {renderDataTables(values, formArrayMethods)}
                      <InvoiceSummaryPanel
                        invoice={{ ...invoice, items: values.invoiceItems }}
                        editable={editable && canWriteInvoice}
                        handleEditDiscount={handleEditDiscount}
                      />
                    </ModalSection>
                    <StyledDivider />
                    <FormSubmitCancelRow
                      confirmText={
                        !isUpdatingInvoice ? (
                          editable && canWriteInvoice ? (
                            <TranslatedText stringId="general.action.save" fallback="Save" />
                          ) : (
                            <TranslatedText stringId="general.action.close" fallback="Close" />
                          )
                        ) : (
                          <CircularProgress size={14} color={Colors.white} />
                        )
                      }
                      onConfirm={editable && canWriteInvoice ? submitForm : onClose}
                      onCancel={editable && canWriteInvoice ? onClose : undefined}
                      confirmDisabled={isUpdatingInvoice}
                      confirmStyle={`
                      &.Mui-disabled {
                        color: ${Colors.white};
                        background-color: ${Colors.primary};
                        opacity: 0.3;
                      }
                    `}
                    />
                  </FormContainer>
                );
              }}
            </FieldArray>
          )}
        />
      </>
    </Modal>
  );
};
