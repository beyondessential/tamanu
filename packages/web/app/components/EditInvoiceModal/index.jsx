import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';
import { CircularProgress, Divider } from '@material-ui/core';
import { INVOICE_LINE_TYPE_LABELS } from '@tamanu/constants';
import { Modal } from '../Modal';
import { TranslatedEnum, TranslatedText } from '../Translation';
import { Form } from '../Field';
import { useApi } from '../../api';
import { Colors, denseTableStyle } from '../../constants';
import { FormSubmitCancelRow } from '../ButtonRow';
import { DataFetchingTable } from '../Table';
import { DateDisplay } from '../DateDisplay';
import { Button } from '../Button';
import { ItemHeader, ItemRow } from './ItemRow';
import { useEncounter } from '../../contexts/Encounter';
import { getInvoiceLineCode } from '../../utils/invoiceDetails';
import { InvoiceSummaryPanel } from '../InvoiceSummaryPanel';
import { StatusDisplay } from '../../utils/invoiceStatus';
import { useInvoiceLineTotals } from '../../hooks/useInvoiceLineTotals';

const LinkText = styled.div`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.primary};
  margin-top: 10px;
  margin-bottom: 10px;
  cursor: pointer;
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
`;

const StatusContainer = styled.span`
  margin-left: 20px;
  font-weight: 400;
`;

export const EditInvoiceModal = ({ open, onClose, invoiceId, displayId, encounterId, invoiceStatus }) => {
  const [rowList, setRowList] = useState([{ id: uuidv4() }]);
  const [potentialLineItems, setPotentialLineItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const api = useApi();

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`invoices/${encodeURIComponent(invoiceId)}/lineItems`);
      if (!data.length) return;
      setRowList(data.map(item => ({
        id: item.id,
        details: item.invoiceLineType?.name,
        date: item.dateGenerated,
        orderedBy: item.orderedBy?.displayName,
        price: item.invoiceLineType?.price,
        invoiceLineTypeId: item.invoiceLineTypeId,
        orderedById: item.orderedById,
        code: getInvoiceLineCode(item),
        percentageChange: item.percentageChange
      })));
    })();
  }, [api]);

  const { loadEncounter } = useEncounter();

  const updateRowData = useCallback((id, updatedRowData) => {
    setRowList(prevRowList => {
      const newRowList = prevRowList.map(row => row.id === id
        ? { ...row, ...updatedRowData }
        : row
      );
      return newRowList;
    });
  }, []);

  const { discountableTotal, nonDiscountableTotal } = useInvoiceLineTotals(rowList);

  const handleAddRow = (rowData) => {
    const newRowList = [...rowList];
    if (Array.isArray(rowData) && rowData.length) {
      rowData.forEach(newItem => {
        const idExists = newRowList.some(item => item && item.id === newItem.id);
        if (!idExists) {
          newRowList.push({
            id: newItem?.id,
            details: newItem?.name,
            date: newItem?.date,
            orderedBy: newItem?.orderedBy,
            price: newItem?.price,
            invoiceLineTypeId: newItem?.invoiceLineTypeId,
            orderedById: newItem?.orderedById,
            code: newItem?.code,
          });
        }
      });
    } else {
      newRowList.push({ id: uuidv4() });
    }

    setRowList(newRowList);
  };

  const COLUMNS = [
    {
      key: 'date',
      title: <TranslatedText stringId="general.date.label" fallback="Date" />,
      accessor: ({ date }) => <DateDisplay date={date} />,
    },
    {
      key: 'code',
      title: <TranslatedText stringId="invoice.table.column.code" fallback="Code" />
    },
    {
      key: 'type',
      title: <TranslatedText
        stringId="invoice.table.potentialItems.column.category"
        fallback="Category"
      />,
      accessor: ({ type }) => (
        <TranslatedEnum
          prefix="invoice.line.property.type"
          value={type}
          enumValues={INVOICE_LINE_TYPE_LABELS}
        />
      ),
    },
    {
      key: 'orderedBy',
      title: <TranslatedText stringId="invoice.table.column.orderedBy" fallback="Ordered by" />
    },
    {
      key: 'price',
      title: <TranslatedText stringId="invoice.table.column.price" fallback="Price" />,
      accessor: ({ price }) => (
        <TranslatedText
          stringId="invoice.table.cell.price"
          fallback="$:price"
          replacements={{ price }}
        />
      )
    },
    {
      sortable: false,
      accessor: (row) => (
        <SingleAddButton variant="outlined" onClick={() => handleAddRow([row])}>
          <TranslatedText stringId="general.action.add" fallback="Add" />
        </SingleAddButton>
      ),
    },
  ];

  const isEmpty = useMemo(() => {
    const rowListIds = rowList.filter(row => !!row).map(row => row.id);
    return potentialLineItems.every(item => rowListIds.includes(item.id));
  }, [rowList, potentialLineItems]);

  const onDataFetched = useCallback(({ data }) => {
    setPotentialLineItems(data);
  }, []);

  const rowStyle = ({ id }) => {
    const idList = rowList.map(row => row?.id).filter(id => !!id);
    if (idList.includes(id)) return "display: none;";
    return "";
  };

  const initialValues = rowList.reduce((accumulator, currentValue, currentIndex) => ({
    ...accumulator,
    ["date_" + currentIndex]: currentValue?.date || "",
    ["invoiceLineTypeId_" + currentIndex]: currentValue?.invoiceLineTypeId || "",
    ["orderedById_" + currentIndex]: currentValue?.orderedById || "",
  }), {});

  const onDeleteLineItem = (id) => {
    const newRowList = rowList.filter(row => row.id !== id);
    setRowList(newRowList);
  };

  const handleSubmit = async (submitData) => {
    if (isSaving) return;
    setIsSaving(true);

    const invoiceLineItemsData = rowList.map((row, index) => ({
      id: row.id,
      invoiceLineTypeId: submitData[`invoiceLineTypeId_${index}`],
      date: submitData[`date_${index}`],
      orderedById: submitData[`orderedById_${index}`],
    }));

    await api.put(`invoices/${invoiceId}/lineItems`, { invoiceLineItemsData });
    await loadEncounter(encounterId);
    setIsSaving(false);
  };

  const schema = yup.object().shape(
    rowList.reduce((prevRow, _, currentIndex) => ({
      ...prevRow,
      [`date_${currentIndex}`]: yup
        .string()
        .required()
        .translatedLabel(
          <TranslatedText stringId="general.date.label" fallback="Date" />,
        ),
      [`invoiceLineTypeId_${currentIndex}`]: yup
        .string()
        .required()
        .translatedLabel(
          <TranslatedText stringId="invoice.modal.editInvoice.detailsType.label" fallback="Details type" />,
        ),
      [`orderedById_${currentIndex}`]: yup
        .string()
        .required()
        .translatedLabel(
          <TranslatedText stringId="invoice.modal.editInvoice.orderedBy.label" fallback="Ordered by" />,
        ),
    }), {})
  );

  return (
    <Modal
      width="lg"
      title={
        <>
          <TranslatedText
            stringId="invoice.modal.view.title"
            fallback="Invoice number: :invoiceNumber"
            replacements={{ invoiceNumber: displayId }}
          />
          <StatusContainer>
            <StatusDisplay status={invoiceStatus} />
          </StatusContainer>

        </>
      }
      open={open}
      onClose={onClose}
      overrideContentPadding
    >
      <Form
        enableReinitialize
        onSubmit={handleSubmit}
        initialValues={initialValues}
        validationSchema={schema}
        render={({ submitForm }) => (
          <FormContainer>
            <ItemHeader />
            <div>
              {rowList.map((row, index) => (
                <ItemRow
                  key={row?.id}
                  index={index}
                  rowData={row}
                  onDelete={() => onDeleteLineItem(row?.id)}
                  isDeleteDisabled={rowList.length === 1}
                  updateRowData={updateRowData}
                />
              ))}
            </div>
            <LinkText onClick={() => handleAddRow()}>
              {"+ "}<TranslatedText stringId="invoice.modal.editInvoice.action.newRow" fallback="New row" />
            </LinkText>
            <ModalSection>
              <PotentialLineItemsPane>
                <PaneTitle>
                  <TranslatedText
                    stringId="invoice.modal.potentialItems.title"
                    fallback="Patient items to be added"
                  />
                  <BulkAddButton onClick={() => handleAddRow(potentialLineItems)}>
                    <TranslatedText stringId="general.action.addAll" fallback="Add all" />
                  </BulkAddButton>
                </PaneTitle>
                <StyledDataFetchingTable
                  endpoint={`invoices/${invoiceId}/potentialLineItems`}
                  columns={COLUMNS}
                  noDataMessage={
                    <TranslatedText
                      stringId="invoice.modal.potentialInvoices.table.noData"
                      fallback="No potential invoice line items found"
                    />
                  }
                  allowExport={false}
                  rowStyle={rowStyle}
                  onDataFetched={onDataFetched}
                  headerColor={Colors.white}
                  page={null}
                  elevated={false}
                  isEmpty={isEmpty}
                  containerStyle={denseTableStyle.container}
                  cellStyle={denseTableStyle.cell}
                  headStyle={denseTableStyle.head}
                  statusCellStyle={denseTableStyle.statusCell}
                />
              </PotentialLineItemsPane>
              <InvoiceSummaryPanel 
                invoiceId={invoiceId}
                invoiceStatus={invoiceStatus}                
                discountableTotal={discountableTotal}
                nonDiscountableTotal={
                  isNaN(nonDiscountableTotal) ? 0 : nonDiscountableTotal
                }
                isEditInvoice
              />
            </ModalSection>
            <StyledDivider />
            <FormSubmitCancelRow
              confirmText={
                !isSaving
                  ? <TranslatedText stringId="general.action.save" fallback="Save" />
                  : <CircularProgress size={14} color={Colors.white} />
              }
              onConfirm={submitForm}
              onCancel={onClose}
            />
          </FormContainer>)}
      />
    </Modal>
  );
};
