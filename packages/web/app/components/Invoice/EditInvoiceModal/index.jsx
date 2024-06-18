import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import { Box, CircularProgress, Divider } from '@material-ui/core';
import PrintIcon from '@material-ui/icons/Print';
import { FieldArray } from 'formik';
import { differenceBy } from 'lodash';
import { isInvoiceEditable } from '@tamanu/shared/utils/invoice';
import {
  INVOICE_ITEMS_CATEGORY_LABELS,
  INVOICE_PAYMENT_STATUSES,
  INVOICE_STATUSES,
} from '@tamanu/constants';
import { Modal } from '../../Modal';
import { TranslatedEnum, TranslatedText } from '../../Translation';
import { Form } from '../../Field';
import { Colors, denseTableStyle } from '../../../constants';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { DataFetchingTable } from '../../Table';
import { DateDisplay } from '../../DateDisplay';
import { Button } from '../../Button';
import { InvoiceItemHeader, InvoiceItemRow } from './InvoiceItem';
import { InvoiceStatus } from '../InvoiceStatus';
import { InvoiceSummaryPanel } from '../InvoiceSummaryPanel';
import { useUpdateInvoice } from '../../../api/mutations/useInvoiceMutation';
import { ThreeDotMenu } from '../../ThreeDotMenu';

const LinkText = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.primary};
  cursor: pointer;
  width: fit-content;
`;

const SingleAddButton = styled(Button)`
  min-width: 56px;
`;

const BulkAddButton = styled(Button)`
  min-width: 74px;
`;

const FormContainer = styled.div`
  padding: 34px 40px;
`;

const StyledDataFetchingTable = styled(DataFetchingTable)`
  max-height: 400px;
`;

const PotentialLineItemsPane = styled.div`
  width: 70%;
  display: grid;
  margin-left: -4px;
  overflow: auto;
  padding-left: 15px;
  padding-right: 15px;
  background: white;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};

  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: white;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${Colors.softText};
    border-radius: 5px;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: ${Colors.softText};
  }
`;

const PaneTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  padding-right: 5px;
  padding-top: 8px;
  padding-bottom: 8px;
  background: white;
  border-bottom: 1px solid ${Colors.outline};
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

const getDefaultRow = () => ({ id: uuidv4() });

export const EditInvoiceModal = ({
  open,
  onClose,
  invoice,
  handleEditDiscount,
  handleCancelInvoice,
  handleFinaliseInvoice,
  onSuccess,
  isPatientView,
}) => {
  const editable = isInvoiceEditable(invoice);
  const cancelable =
    invoice.status !== INVOICE_STATUSES.CANCELLED &&
    invoice.paymentStatus === INVOICE_PAYMENT_STATUSES.UNPAID &&
    isPatientView;
  const finalisable =
    invoice.status === INVOICE_STATUSES.IN_PROGRESS &&
    !!invoice.encounter?.endDate &&
    isPatientView;

  const [potentialInvoiceItems, setPotentialInvoiceItems] = useState([]);

  const { mutate: updateInvoice, isLoading: isUpdatingInvoice } = useUpdateInvoice(invoice);

  const onPotentialInvoiceItemsFetched = useCallback(data => {
    setPotentialInvoiceItems(data?.data || []);
  }, []);

  const handleSubmit = async data => {
    updateInvoice(
      { ...invoice, items: data.invoiceItems },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      },
    );
  };

  const schema = yup.object({
    invoiceItems: yup.array(
      yup.object({
        orderDate: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText stringId="general.date.label" fallback="Date" />),
        productId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="invoice.modal.editInvoice.details.label"
              fallback="Details"
            />,
          ),
        orderedByUserId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="invoice.modal.editInvoice.orderedBy.label"
              fallback="Ordered by"
            />,
          ),
      }),
    ),
  });

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
            <PrintButton color="primary" variant="outlined" startIcon={<PrintIcon />} size="small">
              <TranslatedText stringId="general.action.print" fallback="Print" />
            </PrintButton>
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
            <Box display="flex" justifyContent="space-between" alignItems="center" paddingX="36px">
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
            <Divider
              style={{
                margin: '15px 36px -15px 36px',
              }}
            />
          </>
        )}
        <Form
          enableReinitialize
          onSubmit={handleSubmit}
          initialValues={{
            invoiceItems: invoice.items?.length ? invoice.items : [getDefaultRow()],
          }}
          validationSchema={schema}
          render={({ submitForm, values }) => (
            <FieldArray name="invoiceItems">
              {formArrayMethods => {
                const isEmptyPotentialInvoiceItems = !differenceBy(
                  potentialInvoiceItems,
                  values.invoiceItems,
                  'id',
                ).length;

                const potentialInvoiceItemRowStyle = ({ id }) => {
                  const idList = values.invoiceItems.map(row => row?.id).filter(Boolean);
                  if (idList.includes(id)) return 'display: none;';
                  return '';
                };

                const handleAddPotentialInvoiceItems = items => {
                  items.forEach(
                    item => !potentialInvoiceItemRowStyle(item) && formArrayMethods.push(item),
                  );
                };

                const POTENTIAL_INVOICE_ITEMS_TABLE_COLUMNS = [
                  {
                    key: 'orderDate',
                    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
                    accessor: ({ orderDate }) => <DateDisplay date={orderDate} />,
                  },
                  {
                    key: 'code',
                    title: <TranslatedText stringId="invoice.table.column.code" fallback="Code" />,
                    accessor: ({ code }) => code,
                  },
                  {
                    key: 'type',
                    title: (
                      <TranslatedText
                        stringId="invoice.table.column.category"
                        fallback="Category"
                      />
                    ),
                    accessor: ({ type }) => (
                      <TranslatedEnum
                        prefix="invoice.table.column.type"
                        value={type}
                        enumValues={INVOICE_ITEMS_CATEGORY_LABELS}
                      />
                    ),
                  },
                  {
                    key: 'price',
                    title: (
                      <TranslatedText stringId="invoice.table.column.price" fallback="Price" />
                    ),
                    accessor: ({ price }) => (
                      <TranslatedText
                        stringId="invoice.table.cell.price"
                        fallback="$:price"
                        replacements={{ price }}
                      />
                    ),
                  },
                  {
                    sortable: false,
                    accessor: row => (
                      <SingleAddButton
                        variant="outlined"
                        onClick={() => handleAddPotentialInvoiceItems([row])}
                      >
                        <TranslatedText stringId="general.action.add" fallback="Add" />
                      </SingleAddButton>
                    ),
                  },
                ];

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
                          editable={editable}
                        />
                      ))}
                    </Box>
                    {editable && (
                      <LinkText onClick={() => formArrayMethods.push(getDefaultRow())}>
                        {'+ '}
                        <TranslatedText
                          stringId="invoice.modal.editInvoice.action.newRow"
                          fallback="Add new row"
                        />
                      </LinkText>
                    )}
                    <ModalSection>
                      {editable && (
                        <PotentialLineItemsPane>
                          <PaneTitle>
                            <TranslatedText
                              stringId="invoice.modal.potentialItems.title"
                              fallback="Patient items to be added"
                            />
                            {!isEmptyPotentialInvoiceItems && (
                              <BulkAddButton
                                onClick={() =>
                                  handleAddPotentialInvoiceItems(potentialInvoiceItems)
                                }
                              >
                                <TranslatedText
                                  stringId="general.action.addAll"
                                  fallback="Add all"
                                />
                              </BulkAddButton>
                            )}
                          </PaneTitle>
                          <StyledDataFetchingTable
                            endpoint={`invoices/${invoice.id}/potentialInvoiceItems`}
                            columns={POTENTIAL_INVOICE_ITEMS_TABLE_COLUMNS}
                            noDataMessage={
                              <TranslatedText
                                stringId="invoice.modal.potentialInvoices.table.noData"
                                fallback="No patient items to be added"
                              />
                            }
                            allowExport={false}
                            rowStyle={potentialInvoiceItemRowStyle}
                            onDataFetched={onPotentialInvoiceItemsFetched}
                            headerColor={Colors.white}
                            fetchOptions={{ page: undefined }}
                            elevated={false}
                            isEmpty={isEmptyPotentialInvoiceItems}
                            containerStyle={denseTableStyle.container}
                            cellStyle={denseTableStyle.cell}
                            headStyle={denseTableStyle.head}
                            statusCellStyle={denseTableStyle.statusCell}
                            disablePagination
                          />
                        </PotentialLineItemsPane>
                      )}
                      <InvoiceSummaryPanel
                        invoice={{ ...invoice, items: values.invoiceItems }}
                        editable={editable}
                        handleEditDiscount={handleEditDiscount}
                      />
                    </ModalSection>
                    <StyledDivider />
                    <FormSubmitCancelRow
                      confirmText={
                        !isUpdatingInvoice ? (
                          <TranslatedText stringId="general.action.save" fallback="Save" />
                        ) : (
                          <CircularProgress size={14} color={Colors.white} />
                        )
                      }
                      onConfirm={submitForm}
                      onCancel={onClose}
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
