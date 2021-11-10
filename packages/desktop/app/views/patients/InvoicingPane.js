import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import { INVOICE_STATUS_TYPES } from 'shared/constants';

import { useEncounter } from '../../contexts/Encounter';
import { useApi } from '../../api';

import { LoadingIndicator } from '../../components/LoadingIndicator';
import { InvoiceLineItemModal } from '../../components/InvoiceLineItemModal';
import { InvoicePriceChangeItemModal } from '../../components/InvoicePriceChangeItemModal';
import { PotentialInvoiceLineItemsModal } from '../../components/PotentialInvoiceLineItemsModal';
import { InvoiceDetailTable } from '../../components/InvoiceDetailTable';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Button } from '../../components/Button';
import { ContentPane } from '../../components/ContentPane';

const EmptyPane = styled.div`
  text-align: center;
`;

export const InvoicingPane = React.memo(({ encounter }) => {
  const [invoiceLineModalOpen, setInvoiceLineModalOpen] = useState(false);
  const [invoicePriceChangeModalOpen, setInvoicePriceChangeModalOpen] = useState(false);
  const [potentialInvoiceLineItemsModalOpen, setPotentialInvoiceLineItemsModalOpen] = useState(
    false,
  );
  const [finaliseInvoiceModalOpen, setFinaliseInvoiceModalOpen] = useState(false);
  const [cancelInvoiceModalOpen, setCancelInvoiceModalOpen] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);
  const { loadEncounter } = useEncounter();
  const api = useApi();

  const handleFinaliseInvoice = useCallback(async () => {
    api.put(`invoices/${invoice.id}`, {
      status: INVOICE_STATUS_TYPES.FINALISED,
      date: new Date(),
    });
    setFinaliseInvoiceModalOpen(false);
    await loadEncounter(encounter.id);
  }, [invoice, encounter]);

  const handleCancelInvoice = useCallback(async () => {
    api.put(`invoices/${invoice.id}`, {
      status: INVOICE_STATUS_TYPES.CANCELLED,
    });
    setCancelInvoiceModalOpen(false);
    await loadEncounter(encounter.id);
  }, [invoice, encounter]);

  useEffect(() => {
    (async () => {
      try {
        const invoiceResponse = await api.get(`encounter/${encounter.id}/invoice`);
        setInvoice(invoiceResponse);
      } catch (e) {
        setError('Cannot find invoice for this encounter');
      }
    })();
  }, [encounter]);

  if (error) {
    return (
      <EmptyPane>
        <h3>{error}</h3>
      </EmptyPane>
    );
  }
  if (!invoice) {
    return <LoadingIndicator />;
  }

  return (
    <div>
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
      <PotentialInvoiceLineItemsModal
        open={potentialInvoiceLineItemsModalOpen}
        invoiceId={invoice.id}
        onClose={() => setPotentialInvoiceLineItemsModalOpen(false)}
        onSaved={async () => {
          setPotentialInvoiceLineItemsModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <ConfirmModal
        title={`Finalise invoice number: ${invoice.displayId}`}
        text="Are you sure you want to finalise this invoice?"
        subText="You will not be able to edit the invoice once it is finalised."
        confirmButtonColor="primary"
        confirmButtonText="Finalise"
        open={finaliseInvoiceModalOpen}
        onClose={() => setFinaliseInvoiceModalOpen(false)}
        onConfirm={handleFinaliseInvoice}
      />
      <ConfirmModal
        title={`Cancel invoice number: ${invoice.displayId}`}
        text="Are you sure you want to cancel this invoice?"
        subText="You will not be able to edit the invoice once it is cancelled."
        confirmButtonColor="primary"
        confirmButtonText="Cancel Invoice"
        open={cancelInvoiceModalOpen}
        onClose={() => setCancelInvoiceModalOpen(false)}
        onConfirm={handleCancelInvoice}
      />
      <h3 style={{ marginLeft: '20px' }}>
        <span>Invoice number: </span>
        <span>{invoice.displayId}</span>
      </h3>
      <InvoiceDetailTable invoice={invoice} allowExport={false} />
      {[INVOICE_STATUS_TYPES.FINALISED, INVOICE_STATUS_TYPES.CANCELLED].includes(
        invoice.status,
      ) ? null : (
        <ContentPane>
          <Button
            onClick={() => setInvoiceLineModalOpen(true)}
            variant="contained"
            color="primary"
            style={{ marginRight: '20px' }}
          >
            Add item
          </Button>
          <Button
            onClick={() => setInvoicePriceChangeModalOpen(true)}
            variant="contained"
            color="primary"
            style={{ marginRight: '20px' }}
          >
            Add price change
          </Button>
          <Button
            onClick={() => setPotentialInvoiceLineItemsModalOpen(true)}
            variant="contained"
            color="primary"
            style={{ marginRight: '20px' }}
          >
            Populate invoice
          </Button>
          <Button
            onClick={() => setCancelInvoiceModalOpen(true)}
            variant="contained"
            color="primary"
            style={{ marginRight: '20px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setFinaliseInvoiceModalOpen(true)}
            variant="contained"
            color="primary"
          >
            Finalise
          </Button>
        </ContentPane>
      )}
    </div>
  );
});
