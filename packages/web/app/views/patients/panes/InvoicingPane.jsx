import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { useEncounter } from '../../../contexts/Encounter';
import { useApi, isErrorUnknownAllow404s } from '../../../api';
import { isInvoiceEditable } from '../../../utils';
import { InvoiceLineItemModal } from '../../../components/InvoiceLineItemModal';
import { InvoicePriceChangeItemModal } from '../../../components/InvoicePriceChangeItemModal';
import { PotentialInvoiceLineItemsModal } from '../../../components/PotentialInvoiceLineItemsModal';
import { InvoiceDetailTable } from '../../../components/InvoiceDetailTable';
import { Button, OutlinedButton } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { Colors } from '../../../constants';
import { TabPane } from '../components';

const EmptyPane = styled(ContentPane)`
  text-align: center;
`;

const ActionsPane = styled.div`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;

  > button {
    margin-left: 16px;
  }
`;

const InvoiceHeading = styled(Typography)`
  color: ${Colors.primary};
  font-weight: 500;
  font-size: 14px;
  margin-left: 5px;
`;

const InvoiceTopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
      const invoiceResponse = await api.get(
        `encounter/${encounter.id}/invoice`,
        {},
        { isErrorUnknown: isErrorUnknownAllow404s },
      );
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
        <Button onClick={createInvoice}>Create invoice</Button>
      </EmptyPane>
    );
  }

  return (
    <TabPane>
      <InvoiceTopBar>
        <InvoiceHeading>Invoice number: {invoice.displayId}</InvoiceHeading>
        {isInvoiceEditable(invoice) ? (
          <ActionsPane>
            <Button onClick={() => setInvoiceLineModalOpen(true)}>Add item</Button>
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
            <OutlinedButton onClick={() => setInvoicePriceChangeModalOpen(true)}>
              Add price change
            </OutlinedButton>
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
            <OutlinedButton onClick={() => setPotentialLineItemsModalOpen(true)}>
              Populate invoice
            </OutlinedButton>
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
    </TabPane>
  );
});
