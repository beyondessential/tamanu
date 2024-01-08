import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import {
  INVOICE_LINE_TYPES,
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PRICE_CHANGE_TYPES,
  INVOICE_PRICE_CHANGE_TYPE_LABELS,
} from '@tamanu/constants';

import { useApi } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { Colors } from '../constants';
import { isInvoiceEditable, calculateInvoiceTotal, calculateInvoiceLinesTotal } from '../utils';

import { DataFetchingTable } from './Table';
import { DeleteButton } from './Button';
import { InvoiceLineItemModal } from './InvoiceLineItemModal';
import { InvoicePriceChangeItemModal } from './InvoicePriceChangeItemModal';
import { ConfirmModal } from './ConfirmModal';
import { DropdownButton } from './DropdownButton';
import { DateDisplay } from './DateDisplay';

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
      label: 'Edit',
      onClick: () => setInvoiceLineModalOpen(true),
    },
    {
      label: 'Delete',
      onClick: () => setDeleteInvoiceLineModalOpen(true),
    },
  ];

  return (
    <>
      <InvoiceLineItemModal
        title="Edit item"
        actionText="Save"
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
        title="Delete invoice line item"
        text="Are you sure you want to delete this invoice line item?"
        subText="You will not be able to revert this action."
        confirmButtonText="Delete"
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
      label: 'Edit',
      onClick: () => setInvoicePriceChangeModalOpen(true),
    },
    {
      label: 'Delete',
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
          await api.delete(`invoices/${row.invoiceId}/invoicePriceChangeItems/${row.id}`);
          setDeletePercentageChangeModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
    </>
  );
});

const getDisplayName = ({ orderedBy }) => orderedBy?.displayName ?? '';
const getPercentageChange = ({ percentageChange }) => {
  const percentageChangeNumber =
    percentageChange !== undefined ? parseFloat(percentageChange) * 100 : null;

  if (percentageChangeNumber === null) {
    return '';
  }

  return percentageChangeNumber > 0 ? `+${percentageChangeNumber}%` : `${percentageChangeNumber}%`;
};

const getInvoiceLineCode = row => {
  const { itemType } = row.invoiceLineType;
  switch (itemType) {
    case INVOICE_LINE_TYPES.PROCEDURE_TYPE:
      return row.invoiceLineType?.procedureType?.code;
    case INVOICE_LINE_TYPES.IMAGING_TYPE:
      return row.invoiceLineType?.imagingType?.code;
    case INVOICE_LINE_TYPES.LAB_TEST_TYPE:
      return row.invoiceLineType?.labTestType?.code;
    default:
      return '';
  }
};
const getInvoicePriceChangeCode = row => {
  if (!row.invoicePriceChangeType) {
    return '';
  }
  const { itemType } = row.invoicePriceChangeType;
  switch (itemType) {
    case INVOICE_PRICE_CHANGE_TYPES.PATIENT_BILLING_TYPE:
      return row.invoicePriceChangeType?.patientBillingType?.code;
    default:
      return '';
  }
};
const getInvoiceLineCategory = row => {
  const { name } = row.invoiceLineType;
  const { itemType } = row.invoiceLineType;
  const category = INVOICE_LINE_TYPE_LABELS[itemType] || 'Unknown';
  return (
    <>
      <p>{category}</p>
      <InvoiceLineDetail title={name}>{name}</InvoiceLineDetail>
    </>
  );
};
const getInvoicePriceChangeCategory = row => {
  let name = null;
  let category = null;
  if (row.invoicePriceChangeType) {
    name = row.invoicePriceChangeType.name;
    const { itemType } = row.invoicePriceChangeType;
    category = INVOICE_PRICE_CHANGE_TYPE_LABELS[itemType] || 'Unknown';
  } else {
    name = row.description;
    category = 'Additional';
  }

  return (
    <>
      <p>{category}</p>
      <InvoiceLineDetail>{name}</InvoiceLineDetail>
    </>
  );
};
const getInvoiceInlinePrice = row => {
  const originalPrice = parseFloat(row.invoiceLineType.price);
  const percentageChange = row.percentageChange ? parseFloat(row.percentageChange) : 0;
  const priceChange = originalPrice * percentageChange;
  return `$${originalPrice + priceChange}`;
};
const INVOICE_LINE_ACTION_COLUMN = {
  key: 'actions',
  title: 'Actions',
  sortable: false,
  accessor: row => <InvoiceLineActionDropdown row={row} />,
  dontCallRowInput: true,
};
const INVOICE_LINE_COLUMNS = [
  {
    key: 'dateGenerated',
    title: 'Date',
    sortable: false,
    accessor: ({ dateGenerated }) => <DateDisplay date={dateGenerated} />,
  },
  { key: 'code', title: 'Code', sortable: false, accessor: getInvoiceLineCode },
  {
    key: 'category',
    title: 'Category/ Details',
    sortable: false,
    accessor: getInvoiceLineCategory,
  },
  { key: 'orderedBy', title: 'Ordered by', sortable: false, accessor: getDisplayName },
  {
    key: 'originalPrice',
    title: 'Unit price',
    sortable: false,
    accessor: row => `$${row.invoiceLineType.price}`,
  },
  {
    key: 'percentageChange',
    title: '% (-/+)',
    sortable: false,
    accessor: getPercentageChange,
  },
  { key: 'price', title: 'Total', sortable: false, accessor: getInvoiceInlinePrice },
];

const INVOICE_PRICE_CHANGE_ACTION_COLUMN = {
  key: 'actions',
  title: 'Actions',
  sortable: false,
  accessor: row => <InvoicePriceChangeActionDropdown row={row} />,
  dontCallRowInput: true,
};
const INVOICE_PRICE_CHANGE_COLUMNS = [
  {
    key: 'date',
    title: 'Date',
    sortable: false,
    accessor: ({ date }) => (date ? <DateDisplay date={date} /> : ''),
  },
  { key: 'code', title: 'Code', sortable: false, accessor: getInvoicePriceChangeCode },
  {
    key: 'category',
    title: 'Category/ Details',
    sortable: false,
    accessor: getInvoicePriceChangeCategory,
  },
  { key: 'orderedBy', title: 'Ordered by', sortable: false, accessor: getDisplayName },
  { key: 'originalPrice', title: 'Unit price', sortable: false, accessor: () => '' },
  {
    key: 'percentageChange',
    title: '% (-/+)',
    sortable: false,
    accessor: getPercentageChange,
  },
];

const DiscountHeading = styled.h4`
  margin: 1rem;
`;

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

  return (
    <>
      <DataFetchingTable
        endpoint={`invoices/${invoice.id}/lineItems`}
        columns={[
          ...INVOICE_LINE_COLUMNS,
          ...(isInvoiceEditable(invoice) ? [INVOICE_LINE_ACTION_COLUMN] : []),
        ]}
        noDataMessage="No invoice line items found"
        allowExport={false}
        onDataFetched={updateLineItems}
      />
      <InvoiceTotal>Sub-Total: ${invoiceLinesTotal}</InvoiceTotal>
      <DiscountHeading>Discounts / Mark-ups</DiscountHeading>
      <DataFetchingTable
        endpoint={`invoices/${invoice.id}/priceChangeItems`}
        columns={[
          ...INVOICE_PRICE_CHANGE_COLUMNS,
          {
            key: 'price',
            title: 'Total',
            sortable: false,
            accessor: ({ percentageChange }) => {
              const priceChange = (percentageChange || 0) * invoiceLinesTotal;
              if (priceChange === 0) {
                return '$0';
              }
              return priceChange > 0 ? `+$${priceChange}` : `-$${-priceChange}`;
            },
          },
          ...(isInvoiceEditable(invoice) ? [INVOICE_PRICE_CHANGE_ACTION_COLUMN] : []),
        ]}
        noDataMessage="No additional price change found"
        allowExport={false}
        onDataFetched={updatePriceChangeItems}
      />
      <InvoiceTotal>Total: ${invoiceTotal}</InvoiceTotal>
    </>
  );
});
