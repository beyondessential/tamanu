import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { calculateInvoiceTotal, calculateInvoiceLinesTotal } from 'shared/utils';
import {
  INVOICE_LINE_TYPES,
  INVOICE_LINE_TYPE_LABELS,
  INVOICE_PRICE_CHANGE_TYPES,
  INVOICE_PRICE_CHANGE_TYPE_LABELS,
} from 'shared/constants';

import { useApi } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { Colors } from '../constants';
import { isInvoiceEditable } from '../utils';

import { Table } from './Table';
import { InvoiceLineItemModal } from './InvoiceLineItemModal';
import { InvoicePriceChangeItemModal } from './InvoicePriceChangeItemModal';
import { ConfirmModal } from './ConfirmModal';
import { DropdownButton } from './DropdownButton';
import { DateDisplay } from './DateDisplay';

const InvoiceLineDetail = styled.p`
  font-size: 15px;
  color: ${Colors.midText};
`;

const InvoiceLinesTotal = styled.div`
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
        invoiceLineItemId={row.id}
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
        isDelete
        open={deleteInvoiceLineModalOpen}
        onClose={() => setDeleteInvoiceLineModalOpen(false)}
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
        isDelete
        open={deleteInvoicePriceChangeModalOpen}
        onClose={() => setDeletePercentageChangeModalOpen(false)}
        onConfirm={async () => {
          await api.delete(`invoices/${row.invoiceId}/invoicePriceChangeItems/${row.id}`);
          setDeletePercentageChangeModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
    </>
  );
});

const getDisplayName = ({ orderedBy }) => (orderedBy || {}).displayName || '';
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
  const { item_type: itemType } = row.invoiceLineType;
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
  const { item_type: itemType } = row.invoiceLineType;
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
const getInvoiceLineActions = row => <InvoiceLineActionDropdown row={row} />;
const getInvoicePriceChangeActions = row => <InvoicePriceChangeActionDropdown row={row} />;
const getDate = ({ date }) => (date ? <DateDisplay date={date} /> : '');
const getInvoiceInlinePrice = row => {
  const originalPrice = parseFloat(row.invoiceLineType.price);
  const percentageChange = row.percentageChange ? parseFloat(row.percentageChange) : 0;
  const priceChange = originalPrice * percentageChange;
  return `$${originalPrice + priceChange}`;
};
const getAdditionalPriceChange = ({ row, sections }) => {
  const invoiceLines = sections[0].data;
  const total = calculateInvoiceLinesTotal(invoiceLines);
  const priceChange = (row.percentageChange || 0) * total;
  return priceChange > 0 ? `+$${priceChange}` : `-$${Math.abs(priceChange)}`;
};

const invoiceLinesTotalAccessor = invoiceLines => {
  if (!invoiceLines?.length) {
    return null;
  }

  const total = calculateInvoiceLinesTotal(invoiceLines);
  const totalString = `Sub-Total: $${total}`;
  return <InvoiceLinesTotal>{totalString}</InvoiceLinesTotal>;
};

const invoiceTotalAccessor = ({ sections }) => {
  let total = 0;
  if (sections.length) {
    const [invoiceLineItemsSection, invoicePriceChangeItemsSection] = sections;
    total = calculateInvoiceTotal(
      invoiceLineItemsSection.data,
      invoicePriceChangeItemsSection.data,
    );
  }
  const totalString = `Total: $${total}`;
  return <InvoiceLinesTotal>{totalString}</InvoiceLinesTotal>;
};

const getColumns = (initialColumns, actionColumn, overrideColumns, status) => {
  if (overrideColumns) {
    return initialColumns.filter(col => overrideColumns.includes(col.key));
  }
  return isInvoiceEditable(status) ? [...initialColumns, actionColumn] : initialColumns;
};

const ACTION_COLUMN = { key: 'actions', title: 'Actions', sortable: false };
const GLOBAL_COLUMNS = [
  { key: 'date', title: 'Date', sortable: false },
  { key: 'code', title: 'Code', sortable: false },
  { key: 'category', title: 'Category/Details', sortable: false },
  { key: 'orderedBy', title: 'Ordered by', sortable: false },
  { key: 'originalPrice', title: 'Original price', sortable: false },
  { key: 'percentageChange', title: 'Percentage change', sortable: false },
  { key: 'price', title: 'Price', sortable: false },
];

const INVOICE_LINE_ACTION_COLUMN = {
  key: 'actions',
  accessor: getInvoiceLineActions,
  dontCallRowInput: true,
};
const INVOICE_LINE_COLUMNS = [
  { key: 'date', accessor: getDate },
  { key: 'code', accessor: getInvoiceLineCode },
  { key: 'category', accessor: getInvoiceLineCategory },
  { key: 'orderedBy', accessor: getDisplayName },
  { key: 'originalPrice', accessor: row => `$${row.invoiceLineType.price}` },
  { key: 'percentageChange', accessor: getPercentageChange },
  { key: 'price', accessor: getInvoiceInlinePrice },
];

const INVOICE_PRICE_CHANGE_ACTION_COLUMN = {
  key: 'actions',
  accessor: getInvoicePriceChangeActions,
  dontCallRowInput: true,
};
const INVOICE_PRICE_CHANGE_COLUMNS = [
  { key: 'date', accessor: getDate },
  { key: 'code', accessor: getInvoicePriceChangeCode },
  {
    key: 'category',
    accessor: getInvoicePriceChangeCategory,
  },
  { key: 'orderedBy', accessor: getDisplayName },
  { key: 'originalPrice', accessor: () => '' },
  { key: 'percentageChange', accessor: getPercentageChange },
  { key: 'price', accessor: getAdditionalPriceChange, passAllData: true },
];

export const InvoiceDetailTable = React.memo(({ invoice, overrideColumns, allowExport = true }) => {
  const api = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      try {
        const { data: invoiceLineItems } = await api.get(`invoices/${invoice.id}/invoiceLineItems`);
        const { data: invoicePriceChangeItems } = await api.get(
          `invoices/${invoice.id}/invoicePriceChangeItems`,
        );
        const invoiceLinesSection = {
          data: invoiceLineItems,
          noDataMessage: 'No invoice line items found',
          columns: getColumns(
            INVOICE_LINE_COLUMNS,
            INVOICE_LINE_ACTION_COLUMN,
            overrideColumns,
            invoice.status,
          ),
          footerAccessor: invoiceLinesTotalAccessor,
        };

        const invoicePriceChangeItemsSection = {
          name: 'Additional price change',
          data: invoicePriceChangeItems,
          noDataMessage: 'No additional price change found',
          columns: getColumns(
            INVOICE_PRICE_CHANGE_COLUMNS,
            INVOICE_PRICE_CHANGE_ACTION_COLUMN,
            overrideColumns,
            invoice.status,
          ),
        };

        setSections([invoiceLinesSection, invoicePriceChangeItemsSection]);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        setErrorMessage(error.message);
      }
    })();
  }, []);

  return (
    <Table
      isLoading={isLoading}
      columns={getColumns(GLOBAL_COLUMNS, ACTION_COLUMN, overrideColumns, invoice.status)}
      sections={sections}
      errorMessage={errorMessage}
      noDataMessage="No invoice line items found"
      exportName="TamanuExport"
      tableFooter={invoiceTotalAccessor}
      allowExport={allowExport}
    />
  );
});
