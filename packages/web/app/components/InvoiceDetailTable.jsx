import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PRICE_CHANGE_TYPE_LABELS,
  INVOICE_PRICE_CHANGE_TYPES,
} from '@tamanu/constants';

import { useApi } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { Colors } from '../constants';
import { calculateInvoiceLinesDiscountableTotal, calculateInvoiceLinesNonDiscountableTotal, calculateInvoiceLinesTotal, calculateInvoiceTotal, isInvoiceEditable } from '../utils';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TranslatedText } from './Translation';
import { getInvoiceLineCode } from '../utils/invoiceDetails';
import { InvoiceSummaryPanel } from './InvoiceSummaryPanel';
import { denseTableStyle } from '../constants';
import { Box } from '@material-ui/core';

const InvoiceLineDetail = styled.p`
  font-size: 15px;
  color: ${Colors.midText};
`;

const InvoiceTotal = styled.div`
  font-weight: bold;
  margin: 1.5rem;
  text-align: right;
`;

const InvoiceLineActionDropdown = React.memo(({ row }) => {
  const [invoiceLineModalOpen, setInvoiceLineModalOpen] = useState(false);
  const [deleteInvoiceLineModalOpen, setDeleteInvoiceLineModalOpen] = useState(false);
  const { loadEncounter, encounter } = useEncounter();
  const api = useApi();

  const actions = [
    {
      label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
      onClick: () => setInvoiceLineModalOpen(true),
    },
    {
      label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
      onClick: () => setDeleteInvoiceLineModalOpen(true),
    },
  ];

  return (
    <>
      <InvoiceLineItemModal
        title={<TranslatedText stringId="invoice.line.modal.edit.title" fallback="Edit item" />}
        actionText={<TranslatedText stringId="general.action.save" fallback="Save" />}
        open={invoiceLineModalOpen}
        invoiceId={row.invoiceId}
        invoiceLineItem={row}
        onClose={() => setInvoiceLineModalOpen(false)}
        onSaved={async () => {
          setInvoiceLineModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <ConfirmModal
        title={
          <TranslatedText
            stringId="invoice.line.modal.delete.title"
            fallback="Delete invoice line item"
          />
        }
        text={
          <TranslatedText
            stringId="invoice.line.modal.delete.text"
            fallback="Are you sure you want to delete this invoice line item?"
          />
        }
        subText={
          <TranslatedText
            stringId="invoice.line.modal.delete.subText"
            fallback="You will not be able to revert this action."
          />
        }
        confirmButtonText={<TranslatedText stringId="general.action.delete" fallback="Delete" />}
        ConfirmButton={DeleteButton}
        open={deleteInvoiceLineModalOpen}
        onCancel={() => setDeleteInvoiceLineModalOpen(false)}
        onConfirm={async () => {
          await api.delete(`invoices/${row.invoiceId}/lineItems/${row.id}`);
          setDeleteInvoiceLineModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <DropdownButton actions={actions} />
    </>
  );
});

const InvoicePriceChangeActionDropdown = React.memo(({ row }) => {
  const [invoicePriceChangeModalOpen, setInvoicePriceChangeModalOpen] = useState(false);
  const [deleteInvoicePriceChangeModalOpen, setDeletePercentageChangeModalOpen] = useState(false);
  const { loadEncounter, encounter } = useEncounter();
  const api = useApi();

  const actions = [
    {
      label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
      onClick: () => setInvoicePriceChangeModalOpen(true),
    },
    {
      label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
      onClick: () => setDeletePercentageChangeModalOpen(true),
    },
  ];

  return (
    <>
      <DropdownButton actions={actions} />
      <InvoicePriceChangeItemModal
        title="Edit additional price change item"
        actionText="Save"
        open={invoicePriceChangeModalOpen}
        invoiceId={row.invoiceId}
        invoicePriceChangeItemId={row.id}
        onClose={() => setInvoicePriceChangeModalOpen(false)}
        onSaved={async () => {
          setInvoicePriceChangeModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <ConfirmModal
        title="Delete price change item"
        text="Are you sure you want to delete this price change item?"
        subText="You will not be able to revert this action."
        confirmButtonText="Delete"
        ConfirmButton={DeleteButton}
        open={deleteInvoicePriceChangeModalOpen}
        onCancel={() => setDeletePercentageChangeModalOpen(false)}
        onConfirm={async () => {
          await api.delete(`invoices/${row.invoiceId}/priceChangeItems/${row.id}`);
          setDeletePercentageChangeModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
    </>
  );
});

const getDisplayName = ({ orderedBy }) => orderedBy?.displayName ?? '';

const getInvoiceLineCategory = row => {
  const { name } = row.invoiceLineType;
  return (
    <span>{name}</span>
  );
};

const StyledTitleCell = ({ value }) => (
  <Box sx={{ color: Colors.midText, fontWeight: 400 }}>
    {value}
  </Box>
);

const PriceCell = styled.div`
  display: flex;
  gap: 10px;
`;

const PriceText = styled.span`
  text-decoration: ${props => props.isCrossedOut ? 'line-through' : 'none'};
`;

const getPrice = (row) => {
  const originalPrice = parseFloat(row?.invoiceLineType?.price).toFixed(2);
  const percentageChange = row.percentageChange ? parseFloat(row.percentageChange).toFixed(2) : 0;
  const priceChange = (originalPrice * percentageChange).toFixed(2);

  return (
    <PriceCell>
      <PriceText isCrossedOut={!!percentageChange}>{originalPrice}</PriceText>
      {!!percentageChange && <span>{priceChange}</span>}
    </PriceCell>
  );
};

const INVOICE_LINE_COLUMNS = [
  {
    key: 'dateGenerated',
    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
    sortable: false,
    accessor: ({ dateGenerated }) => <DateDisplay date={dateGenerated} />,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'category',
    title: <TranslatedText stringId="invoice.table.column.details" fallback="Details" />,
    sortable: false,
    accessor: getInvoiceLineCategory,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'code',
    title: <TranslatedText stringId="invoice.table.column.code" fallback="Code" />,
    sortable: false,
    accessor: getInvoiceLineCode,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'orderedBy',
    title: <TranslatedText stringId="invoice.table.column.orderedBy" fallback="Ordered by" />,
    sortable: false,
    accessor: getDisplayName,
    TitleCellComponent: StyledTitleCell,
  },
  {
    key: 'price',
    title: <TranslatedText stringId="invoice.table.column.price" fallback="Price" />,
    sortable: false,
    accessor: getPrice,
    TitleCellComponent: StyledTitleCell,
  },
];

export const InvoiceDetailTable = React.memo(({ invoice }) => {
  const [invoiceLineItems, setInvoiceLineItems] = useState([]);
  const [invoicePriceChangeItems, setInvoicePriceChangeItems] = useState([]);
  const [invoiceLinesTotal, setInvoiceLinesTotal] = useState(0);
  const [invoiceTotal, setInvoiceTotal] = useState(0);

  const updateLineItems = useCallback(({ data }) => setInvoiceLineItems(data), []);
  const updatePriceChangeItems = useCallback(({ data }) => setInvoicePriceChangeItems(data), []);
  useEffect(() => {
    if (invoice.total !== undefined && invoice.total !== null) {
      setInvoiceTotal(invoice.total);
    }
    setInvoiceTotal(calculateInvoiceTotal(invoiceLineItems, invoicePriceChangeItems));
  }, [invoice.total, invoiceLineItems, invoicePriceChangeItems]);

  useEffect(() => {
    setInvoiceLinesTotal(calculateInvoiceLinesTotal(invoiceLineItems));
  }, [invoiceLineItems]);

  const invoiceDiscountableTotal = useMemo(() => {
    return calculateInvoiceLinesDiscountableTotal(invoiceLineItems);
  }, [invoice.total, invoiceLineItems]);

  const invoiceNonDiscountableTotal = useMemo(() => {
    return calculateInvoiceLinesNonDiscountableTotal(invoiceLineItems);
  }, [invoice.total, invoiceLineItems]);

  return (
    <>
      <DataFetchingTable
        endpoint={`invoices/${invoice.id}/lineItems`}
        columns={[
          ...INVOICE_LINE_COLUMNS,
        ]}
        noDataMessage={
          <TranslatedText
            stringId="invoice.line.table.noData"
            fallback="No invoice line items found"
          />
        }
        allowExport={false}
        elevated={false}
        headerColor='white'
        page={null}
        rowStyle={() => 'height: 40px;'}
        headerTextColor={Colors.midText}
        containerStyle={denseTableStyle.container}
        cellStyle={denseTableStyle.cell}
        headStyle={denseTableStyle.head}
        statusCellStyle={denseTableStyle.statusCell}
      />
      <InvoiceSummaryPanel
        invoiceId={invoice.id}
        invoiceDiscountableTotal={invoiceDiscountableTotal}
        invoiceNonDiscountableTotal={invoiceNonDiscountableTotal}
      />
    </>
  );
});
