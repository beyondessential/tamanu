import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import { useEncounter } from '../../../contexts/Encounter';
import { useApi } from '../../../api';
import { isInvoiceEditable } from '../../../utils';

import { InvoiceLineItemModal } from '../../../components/InvoiceLineItemModal';
import { InvoicePriceChangeItemModal } from '../../../components/InvoicePriceChangeItemModal';
import { PotentialInvoiceLineItemsModal } from '../../../components/PotentialInvoiceLineItemsModal';
import { InvoiceDetailTable } from '../../../components/InvoiceDetailTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';

import { Colors } from '../../../constants';

const EmptyPane = styled(ContentPane)`
  text-align: center;
`;

const ActionsPane = styled(ContentPane)`
  display: flex;
  flex-direction: row-reverse;
  column-gap: 1.6rem;
`;

const InvoiceHeading = styled.h3`
  color: ${Colors.primary};
  margin: 24px 1rem; /* 24px to match ContentPane */
`;

const InvoiceTopBar = styled.div`
  display: grid;
  grid-template-columns: 18rem 1fr;
  align-items: center;
`;

export const InvoicingPane = React.memo(({ encounter }) => {
  const [invoiceLineModalOpen, setInvoiceLineModalOpen] = useState(false);
  const [potentialLineItemsModalOpen, setPotentialLineItemsModalOpen] = useState(false);
  const [invoicePriceChangeModalOpen, setInvoicePriceChangeModalOpen] = useState(false);
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
      <InvoiceTopBar>
        <InvoiceHeading>Invoice number: {invoice.displayId}</InvoiceHeading>
        {isInvoiceEditable(invoice) ? (
          <ActionsPane>
            <Button
              onClick={() => setInvoiceLineModalOpen(true)}
              variant="contained"
              color="primary"
            >
              Add item
            </Button>
            <InvoiceLineItemModal
              title="Add item"
              actionText="Add"
              open={invoiceLineModalOpen}
              invoiceId={invoice.id}
              onClose={() => setInvoiceLineModalOpen(false)}
              onSaved={() => {
                setInvoiceLineModalOpen(false);
                loadEncounter(encounter.id);
              }}
            />
            <Button
              onClick={() => setInvoicePriceChangeModalOpen(true)}
              variant="outlined"
              color="primary"
            >
              Add price change
            </Button>
            <InvoicePriceChangeItemModal
              title="Add price change"
              actionText="Create"
              open={invoicePriceChangeModalOpen}
              invoiceId={invoice.id}
              onClose={() => setInvoicePriceChangeModalOpen(false)}
              onSaved={async () => {
                setInvoicePriceChangeModalOpen(false);
                await loadEncounter(encounter.id);
              }}
            />
            <Button
              onClick={() => setPotentialLineItemsModalOpen(true)}
              variant="outlined"
              color="primary"
            >
              Populate invoice
            </Button>
            <PotentialInvoiceLineItemsModal
              open={potentialLineItemsModalOpen}
              invoiceId={invoice.id}
              onClose={() => setPotentialLineItemsModalOpen(false)}
              onSaved={() => {
                setPotentialLineItemsModalOpen(false);
                loadEncounter(encounter.id);
              }}
            />
          </ActionsPane>
        ) : null}
      </InvoiceTopBar>
      <InvoiceDetailTable invoice={invoice} />
    </>
  );
});
