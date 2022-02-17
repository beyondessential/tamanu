import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import {
  INVOICE_LINE_TYPES,
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PRICE_CHANGE_TYPES,
  INVOICE_PRICE_CHANGE_TYPE_LABELS,
} from 'shared/constants';

import { useApi } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { Colors } from '../constants';
import { isInvoiceEditable, calculateInvoiceTotal, calculateInvoiceLinesTotal } from '../utils';

import { Table } from './Table';
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
        title="Edit invoice line item"
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
          await api.delete(`invoices/${row.invoiceId}/invoiceLineItems/${row.id}`);
          setDeleteInvoiceLineModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <DropdownButton color="primary" actions={actions} />
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
      <DropdownButton color="primary" actions={actions} />
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
  const percentageChangeNumber = percentageChange ? parseFloat(percentageChange) * 100 : null;

  if (percentageChangeNumber) {
    return percentageChangeNumber > 0
      ? `+${percentageChangeNumber}%`
      : `${percentageChangeNumber}%`;
  }

  return '';
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
  if (row.invoicePriceChangeType) {
    const { itemType } = row.invoicePriceChangeType;
    switch (itemType) {
      case INVOICE_PRICE_CHANGE_TYPES.PATIENT_BILLING_TYPE:
        return row.invoicePriceChangeType?.patientBillingType?.code;
      default:
        return '';
    }
  }

  return '';
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
    accessor: ({ dateGenerated }) => (dateGenerated ? <DateDisplay date={dateGenerated} /> : ''),
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
    title: 'Original price',
    sortable: false,
    accessor: row => `$${row.invoiceLineType.price}`,
  },
  {
    key: 'percentageChange',
    title: 'Percentage change',
    sortable: false,
    accessor: getPercentageChange,
  },
  { key: 'price', title: 'Price', sortable: false, accessor: getInvoiceInlinePrice },
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
  { key: 'originalPrice', title: 'Original price', sortable: false, accessor: () => '' },
  {
    key: 'percentageChange',
    title: 'Percentage change',
    sortable: false,
    accessor: getPercentageChange,
  },
];

export const InvoiceDetailTable = React.memo(({ invoice }) => {
  const api = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [invoiceLineItems, setInvoiceLineItems] = useState([]);
  const [invoicePriceChangeItems, setInvoicePriceChangeItems] = useState([]);

  const getInvoiceTotal = useCallback(() => {
    let total = 0;

    // when an invoice has been finalised or cancelled, it should have a total locked in.
    if (invoice.total !== undefined && invoice.total !== null) {
      total = invoice.total;
    } else {
      // if not, the invoice is still in progress, calculate the invoice total manually.
      total = calculateInvoiceTotal(invoiceLineItems, invoicePriceChangeItems);
    }

    return total;
  }, [invoice.total, invoiceLineItems, invoicePriceChangeItems]);

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      try {
        const invoiceLineItemsResponse = await api.get(`invoices/${invoice.id}/lineItems`);
        const invoicePriceChangeItemsResponse = await api.get(
          `invoices/${invoice.id}/priceChangeItems`,
        );
        setIsLoading(false);
        setInvoiceLineItems(invoiceLineItemsResponse.data);
        setInvoicePriceChangeItems(invoicePriceChangeItemsResponse.data);
      } catch (error) {
        setIsLoading(false);
        setErrorMessage(error.message);
      }
    })();
  }, [api, invoice.id]);

  // use Table instead of DataFetchingTable because the results of the
  // data retrieval is needed for the call to calculate invoice total
  return (
    <>
      <Table
        isLoading={isLoading}
        columns={[
          ...INVOICE_LINE_COLUMNS,
          isInvoiceEditable(invoice.status) ? INVOICE_LINE_ACTION_COLUMN : undefined,
        ]}
        data={invoiceLineItems}
        errorMessage={errorMessage}
        noDataMessage="No invoice line items found"
        allowExport={false}
      />
      <InvoiceTotal>Sub-Total: {`$${calculateInvoiceLinesTotal(invoiceLineItems)}`}</InvoiceTotal>
      <h4 style={{margin: '1rem'}}>Discounts</h4>
      <Table
        isLoading={isLoading}
        columns={[
          ...INVOICE_PRICE_CHANGE_COLUMNS,
          {
            key: 'price',
            title: 'Price',
            sortable: false,
            accessor: ({ percentageChange }) => {
              const total = calculateInvoiceLinesTotal(invoiceLineItems);
              const priceChange = (percentageChange || 0) * total;
              return priceChange > 0 ? `+$${priceChange}` : `-$${Math.abs(priceChange)}`;
            },
          },
          isInvoiceEditable(invoice.status) ? INVOICE_PRICE_CHANGE_ACTION_COLUMN : undefined,
        ]}
        data={invoicePriceChangeItems}
        errorMessage={errorMessage}
        noDataMessage="No additional price change found"
        allowExport={false}
      />
      <InvoiceTotal>Total: {`$${getInvoiceTotal()}`}</InvoiceTotal>
    </>
  );
});
