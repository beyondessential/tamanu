import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import { useEncounter } from '../../../contexts/Encounter';
import { useApi } from '../../../api';
import { isInvoiceEditable } from '../../../utils';

import { InvoiceLineItemModal } from '../../../components/InvoiceLineItemModal';
import { InvoiceDetailTable } from '../../../components/InvoiceDetailTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';

const EmptyPane = styled(ContentPane)`
  text-align: center;
`;

export const InvoicingPane = React.memo(({ encounter }) => {
  const [invoiceLineModalOpen, setInvoiceLineModalOpen] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);
  const { loadEncounter } = useEncounter();
  const api = useApi();

  const getInvoice = useCallback(async () => {
    try {
      const invoiceResponse = await api.get(`encounter/${encounter.id}/invoice`);
      setInvoice(invoiceResponse);
    } catch (e) {
      // do nothing
    }
  }, [api, encounter.id]);

  const createInvoice = useCallback(async () => {
    try {
      const createInvoiceResponse = await api.post('invoices', {
        encounterId: encounter.id,
      });
      setInvoice(createInvoiceResponse);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError('Unable to create invoice.');
    }
  }, [api, encounter.id]);

  useEffect(() => {
    getInvoice();
  }, [getInvoice]);

  if (error) {
    return (
      <EmptyPane>
        <h3>{error}</h3>
      </EmptyPane>
    );
  }
  if (!invoice) {
    return (
      <EmptyPane>
        <Button variant="contained" color="primary" onClick={createInvoice}>
          Create Invoice
        </Button>
      </EmptyPane>
    );
  }

  return (
    <>
      <h3 style={{ margin: '1rem' }}>Invoice number: {invoice.displayId}</h3>
      <InvoiceDetailTable invoice={invoice} />
      {isInvoiceEditable(invoice.status) ? (
        <ContentPane>
          <Button
            onClick={() => setInvoiceLineModalOpen(true)}
            variant="contained"
            color="primary"
            style={{ marginRight: '20px' }}
          >
            Add item
          </Button>
          <InvoiceLineItemModal
            title="Add invoice line item"
            actionText="Create"
            open={invoiceLineModalOpen}
            invoiceId={invoice.id}
            onClose={() => setInvoiceLineModalOpen(false)}
            onSaved={async () => {
              setInvoiceLineModalOpen(false);
              await loadEncounter(encounter.id);
            }}
          />
        </ContentPane>
      ) : null}
    </>
  );
});
