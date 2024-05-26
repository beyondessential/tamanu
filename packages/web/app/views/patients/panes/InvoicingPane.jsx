import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { isErrorUnknownAllow404s, useApi } from '../../../api';
import { isInvoiceEditable } from '../../../utils';
import { InvoiceDetailTable } from '../../../components/InvoiceDetailTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { Colors, INVOICE_ACTION_MODALS } from '../../../constants';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { EditInvoiceModal } from '../../../components/EditInvoiceModal';
import { CreateInvoiceModal } from '../../../components/CreateInvoiceModal';
import { KebabMenu } from '../../../components/EditInvoiceModal/KebabMenu';
import { StatusDisplay } from '../../../utils/invoiceStatus';

const EmptyPane = styled(ContentPane)`
  text-align: center;
`;

const ActionsPane = styled.div`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
`;

const InvoiceHeading = styled(Typography)`
  display: flex;
  gap: 20px;
`;

const InvoiceTitle = styled(Typography)`
  color: ${Colors.darkestText};
  font-weight: 500;
  font-size: 18px;
`;

const InvoiceTopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid ${Colors.outline};
`;

const InvoiceContainer = styled.div`
  padding: 8px 16px;
  border: 1px solid ${Colors.outline};
`;

const INVOICE_ACTIVE_MODALS = {
  EDIT_INVOICE: "editInvoice",
  CREATE_INVOICE: "createInvoice",
};

export const InvoicingPane = React.memo(({ encounter }) => {
  const [editInvoiceModalOpen, setEditInvoiceModalOpen] = useState(false);
  const [potentialLineItemsModalOpen, setPotentialLineItemsModalOpen] = useState(false);
  const [invoicePriceChangeModalOpen, setInvoicePriceChangeModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

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
      setError(
        <TranslatedText
          stringId="invoice.error.unableToCreate"
          fallback="Unable to create invoice."
        />,
      );
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
        <Button onClick={() => setActiveModal(INVOICE_ACTIVE_MODALS.CREATE_INVOICE)}>
          <TranslatedText stringId="invoice.action.create" fallback="Create invoice" />
        </Button>
        <CreateInvoiceModal 
          open={activeModal === INVOICE_ACTIVE_MODALS.CREATE_INVOICE}
          onClose={() => setActiveModal("")}
        />
      </EmptyPane>
    );
  }

  return (
    <TabPane>
      <InvoiceContainer>
        <InvoiceTopBar>
          <InvoiceHeading>
            <InvoiceTitle>
              <TranslatedText stringId="invoice.invoiceNumber" fallback="Invoice number" />
              {`: ${invoice.displayId}`}
            </InvoiceTitle>
            <StatusDisplay status={invoice.status} />
          </InvoiceHeading>
          {isInvoiceEditable(invoice) ? (
            <ActionsPane>
              <KebabMenu
                modalsEnabled={[INVOICE_ACTION_MODALS.CANCEL_INVOICE]}
                invoiceId={invoice.id}
              />
              <Button onClick={() => setEditInvoiceModalOpen(true)}>
                <TranslatedText stringId="invoice.action.editItem" fallback="Edit invoice" />
              </Button>
              {editInvoiceModalOpen && <EditInvoiceModal
                open={editInvoiceModalOpen}
                onClose={() => setEditInvoiceModalOpen(false)}
                invoiceId={invoice.id}
                displayId={invoice.displayId}
                encounterId={encounter.id}
                invoiceStatus={invoice.status}
              />}
            </ActionsPane>
          ) : null}
        </InvoiceTopBar>
        <InvoiceDetailTable invoice={invoice} />
      </InvoiceContainer>
    </TabPane>
  );
});
