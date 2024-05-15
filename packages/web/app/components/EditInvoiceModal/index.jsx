import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { Modal } from '../Modal';
import { TranslatedEnum, TranslatedText } from '../Translation';
import { Form } from '../Field';
import { useApi } from '../../api';
import { Colors } from '../../constants';
import { FormSubmitCancelRow } from '../ButtonRow';
import { DataFetchingTable } from '../Table';
import { DateDisplay } from '../DateDisplay';
import { INVOICE_LINE_TYPE_LABELS } from '@tamanu/constants';
import { Button } from '../Button';
import { ItemHeader, ItemRow } from './ItemRow';

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
  max-width: 60%;
  margin-left: -4px;
  overflow: auto;
  padding-left: 15px;
  padding-right: 15px;
  background: white;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
`;

const PaneTitle = styled.div`
  min-width: 530px;
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

export const EditInvoiceModal = ({ open, onClose, invoiceId, displayId, invoiceLineItems }) => {
  const defaultRowList = invoiceLineItems.length ? invoiceLineItems.map(item => ({
    invoiceLineTypeId: item.invoiceLineTypeId,
    date: item.dateGenerated,
    orderedById: item.orderedById,
    price: item.invoiceLineType?.price,
  })) : [undefined];
  const [rowList, setRowList] = useState(defaultRowList);
  const [potentialLineItems, setPotentialLineItems] = useState([]);
  const [isEmpty, setIsEmpty] = useState(false);
  const api = useApi();

  const handleAddRow = (rowData) => {
    const newRowList = [...rowList];
    if (Array.isArray(rowData) && rowData.length) {
      rowData.forEach(newItem => {
        const idExists = newRowList.some(item => item && item.id === newItem.id);
        if (!idExists) {
          newRowList.push(newItem);
        }
      });
      setRowList(newRowList);
      return;
    }
    if (!!rowData) {
      newRowList.push(rowData);
      setRowList(newRowList);
      return;
    }
    newRowList.push(undefined);
    setRowList(newRowList);
  };

  const COLUMNS = [
    { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
    { key: 'code', title: 'Code' },
    {
      key: 'type',
      title: 'Category',
      accessor: ({ type }) => (
        <TranslatedEnum
          prefix="invoice.line.property.type"
          value={type}
          enumValues={INVOICE_LINE_TYPE_LABELS}
        />
      ),
    },
    { key: 'orderedBy', title: 'Ordered by' },
    { key: 'price', title: 'Price', accessor: ({ price }) => `$${price}` },
    {
      accessor: (row) => (
        <SingleAddButton variant="outlined" onClick={() => handleAddRow(row)}>
          <TranslatedText stringId="general.action.add" fallback="Add" />
        </SingleAddButton>
      ),
    },
  ];

  useEffect(() => {
    const rowListIds = rowList.filter(row => !!row).map(row => row.id);
    const isEmpty = potentialLineItems.every(item => rowListIds.includes(item.id));
    setIsEmpty(isEmpty);
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
    ["price_" + currentIndex]: currentValue?.price || "",
    ["orderedById_" + currentIndex]: currentValue?.orderedById || "",
  }), {});

  const onDeleteLineItem = (index) => {
    setRowList(prevRowList => {
      const newRowList = [...prevRowList];
      newRowList.splice(index, 1);
      return newRowList;
    });
  };

  const handleSubmit = async (submitData) => {
    const invoiceLineItemsData = [];
    let i = 0;
    while (i < rowList.length) {
      const newInvoiceLineItemData = {
        invoiceLineTypeId: submitData[`invoiceLineTypeId_${i}`],
        date: submitData[`date_${i}`],
        orderedById: submitData[`orderedById_${i}`],
        price: submitData[`price_${i}`]
      };

      if (!!newInvoiceLineItemData.date) invoiceLineItemsData.push(newInvoiceLineItemData);
      i++;
    }

    await api.put(`invoices/${invoiceId}/lineItems`, { invoiceLineItemsData });
  };

  return (
    <Modal
      width="lg"
      title={
        <TranslatedText
          stringId="invoice.modal.view.title"
          fallback="Invoice number: :invoiceNumber"
          replacements={{ invoiceNumber: displayId }}
        />
      }
      open={open}
      onClose={onClose}
      overrideContentPadding
    >
      <Form
        enableReinitialize
        onSubmit={handleSubmit}
        initialValues={initialValues}
        render={({ submitForm }) => (
          <FormContainer>
            <ItemHeader />
            {rowList.map((row, index) => (
              <ItemRow
                key={row?.id}
                index={index}
                rowData={row}
                hasBorderBottom={index === rowList.length - 1}
                category={row?.type
                  ? <TranslatedEnum
                    prefix="invoice.line.property.type"
                    value={row.type}
                    enumValues={INVOICE_LINE_TYPE_LABELS}
                  /> : ""}
                onDelete={() => onDeleteLineItem(index)}
                isDeleteDisabled={rowList.length === 1}
              />
            ))}
            <LinkText onClick={() => handleAddRow()}>
              {"+ "}<TranslatedText stringId="invoice.modal.editInvoice.newRow" fallback="New row" />
            </LinkText>
            <PotentialLineItemsPane>
              <PaneTitle>
                <TranslatedText
                  stringId="invoice.modal.potentialInvoices.title"
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
                headerColor='white'
                page={null}
                elevated={false}
                isDenseTable
                autoGeneratingIds
                isEmpty={isEmpty}
              />
            </PotentialLineItemsPane>
            <StyledDivider />
            <FormSubmitCancelRow
              confirmText={<TranslatedText stringId="general.action.save" fallback="Save" />}
              onConfirm={submitForm}
              onCancel={onClose}
            />
          </FormContainer>)}
      />
    </Modal>
  );
};
