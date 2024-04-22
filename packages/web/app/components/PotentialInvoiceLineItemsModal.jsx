import React from 'react';
import { INVOICE_LINE_TYPE_LABELS } from '@tamanu/constants';
import { useApi } from '../api';
import { ConfirmCancelRow } from './ButtonRow';
import { DateDisplay } from './DateDisplay';
import { DataFetchingTable } from './Table';
import { Modal } from './Modal';
import { TranslatedEnum, TranslatedText } from './Translation';

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
];

export const PotentialInvoiceLineItemsModal = ({ open, onClose, invoiceId, onSaved }) => {
  const api = useApi();
  const addPotentialLineItems = () => api.post(`invoices/${invoiceId}/potentialLineItems`);

  return (
    <Modal
      width="md"
      title={
        <TranslatedText
          stringId="invoice.modal.potentialInvoices.title"
          fallback="Potential invoice line items"
        />
      }
      open={open}
      onClose={onClose}
    >
      <DataFetchingTable
        endpoint={`invoices/${invoiceId}/potentialLineItems`}
        columns={COLUMNS}
        noDataMessage={
          <TranslatedText
            stringId="invoice.modal.potentialInvoices.table.noData"
            fallback="No potential invoice line items found"
          />
        }
        allowExport={false}
      />
      <ConfirmCancelRow
        confirmText={<TranslatedText stringId="general.action.add" fallback="Add" />}
        onConfirm={async () => {
          await addPotentialLineItems();
          onSaved();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
};
