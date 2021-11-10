import React from 'react';

import { INVOICE_LINE_TYPE_LABELS } from 'shared/constants';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getDate = ({ date }) => <DateDisplay date={date} />;
const getInvoiceLineCategory = row => INVOICE_LINE_TYPE_LABELS[row.type] || 'Unknown';
const getPrice = row => `$${row.price}`;

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'code', title: 'Code' },
  { key: 'type', title: 'Category', accessor: getInvoiceLineCategory },
  { key: 'orderedBy', title: 'Ordered by' },
  { key: 'price', title: 'Price', accessor: getPrice },
];

export const PotentialInvoiceLineItemsTable = React.memo(({ invoiceId }) => (
  <DataFetchingTable
    endpoint={`invoices/${invoiceId}/potentialInvoiceLineItems`}
    columns={COLUMNS}
    noDataMessage="No possible invoice line items found"
    allowExport={false}
  />
));
