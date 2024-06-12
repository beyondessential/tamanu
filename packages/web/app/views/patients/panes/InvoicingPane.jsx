import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { Typography } from '@material-ui/core';
import { isErrorUnknownAllow404s, useApi } from '../../../api';
import { calculateInvoiceLinesTotal, isInvoiceEditable } from '../../../utils';
import { InvoiceDetailTable } from '../../../components/InvoiceDetailTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { Colors, INVOICE_ACTION_MODALS, INVOICE_ACTIVE_MODALS } from '../../../constants';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { EditInvoiceModal } from '../../../components/EditInvoiceModal';
import { KebabMenu } from '../../../components/EditInvoiceModal/KebabMenu';
import { InvoiceStatus } from '../../../components/InvoiceStatus';
import { InvoiceSummaryPanel } from '../../../components/InvoiceSummaryPanel';
import { CreateInvoiceModal } from '../../../components/CreateInvoiceModal';
import { useInvoiceModal } from '../../../contexts/InvoiceModal';
import { useEncounterInvoiceQuery } from '../../../api/queries/useEncounterInvoiceQuery';
import { useAuth } from '../../../contexts/Auth';

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
  margin-bottom: 5px;
  border: 1px solid ${Colors.outline};
`;

export const InvoicingPane = React.memo(({ encounter }) => {
  const [error, setError] = useState(null);
  const [invoiceLineItems, setInvoiceLineItems] = useState([]);
  const updateLineItems = useCallback(({ data }) => setInvoiceLineItems(data), []);
  const queryClient = useQueryClient();

  const { currentUser } = useAuth();

  const invoiceTotal = useMemo(() => {
    return calculateInvoiceLinesTotal(invoiceLineItems);
  }, [invoiceLineItems]);

  const { activeModal, handleActiveModal } = useInvoiceModal();

  const api = useApi();

  const { data: invoice } = useEncounterInvoiceQuery(encounter.id);
  const createInvoice = useCallback(async () => {
    try {
      const createInvoiceResponse = await api.post('invoices', {
        encounterId: encounter.id,
      });
      queryClient.invalidateQueries(['encounterInvoice', encounter.id]);
      return createInvoiceResponse;
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

  if (error) {
    return (
      <EmptyPane>
        <h3>{error}</h3>
      </EmptyPane>
    );
  }

  if (!invoice?.id) {
    return (
      <EmptyPane>
        <Button onClick={() => handleActiveModal(INVOICE_ACTIVE_MODALS.CREATE_INVOICE)}>
          <TranslatedText stringId="invoice.action.create" fallback="Create invoice" />
        </Button>
        {activeModal === INVOICE_ACTIVE_MODALS.CREATE_INVOICE && <CreateInvoiceModal
          open={true}
          encounterId={encounter.id}
          currentUser={currentUser}
        />}
      </EmptyPane>
    );
  }

  return (
    <TabPane>
      {activeModal === INVOICE_ACTIVE_MODALS.CREATE_INVOICE && <CreateInvoiceModal
        open={true}
        encounterId={encounter.id}
        currentUser={currentUser}
      />}
      <InvoiceContainer>
        <InvoiceTopBar>
          <InvoiceHeading>
            <InvoiceTitle>
              <TranslatedText stringId="invoice.invoiceNumber" fallback="Invoice number" />
              {`: ${invoice.displayId}`}
            </InvoiceTitle>
            <InvoiceStatus status={invoice.status} />
          </InvoiceHeading>
          {isInvoiceEditable(invoice) ? (
            <ActionsPane>
              <KebabMenu
                modalsEnabled={[INVOICE_ACTION_MODALS.CANCEL_INVOICE]}
                invoiceId={invoice.id}
              />
              <Button onClick={() => handleActiveModal(INVOICE_ACTIVE_MODALS.EDIT_INVOICE)}>
                <TranslatedText stringId="invoice.action.editItem" fallback="Edit invoice" />
              </Button>
              {activeModal === INVOICE_ACTIVE_MODALS.EDIT_INVOICE && <EditInvoiceModal
                open={true}
                encounterId={encounter.id}
              />}
            </ActionsPane>
          ) : null}
        </InvoiceTopBar>
        <InvoiceDetailTable
          invoice={invoice}
          invoiceLineItems={invoiceLineItems}
          updateLineItems={updateLineItems}
        />
      </InvoiceContainer>
      <InvoiceSummaryPanel
        invoiceId={invoice.id}
        invoiceTotal={invoiceTotal}
      />
    </TabPane>
  );
});
