import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
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
import { StatusDisplay } from '../../../utils/invoiceStatus';
import { InvoiceSummaryPanel } from '../../../components/InvoiceSummaryPanel';
import { CreateInvoiceModal } from '../../../components/CreateInvoiceModal';
import { useInvoiceModal } from '../../../contexts/InvoiceModal';

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
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [invoiceLineItems, setInvoiceLineItems] = useState([]);
  const updateLineItems = useCallback(({ data }) => setInvoiceLineItems(data), []);

  const invoiceTotal = useMemo(() => {
    return calculateInvoiceLinesTotal(invoiceLineItems);
  }, [invoiceLineItems]);

  const { activeModal, handleActiveModal } = useInvoiceModal();
  
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

  return (
    <>
      {activeModal === INVOICE_ACTIVE_MODALS.CREATE_INVOICE && <CreateInvoiceModal
        open={true}
        createInvoice={createInvoice}
        invoiceId={invoice?.id}
      />}
      {!invoice
        ? <EmptyPane>
          <Button onClick={() => handleActiveModal(INVOICE_ACTIVE_MODALS.CREATE_INVOICE)}>
            <TranslatedText stringId="invoice.action.create" fallback="Create invoice" />
          </Button>
        </EmptyPane>
        : <TabPane>
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
                  <Button onClick={() => handleActiveModal(INVOICE_ACTIVE_MODALS.EDIT_INVOICE)}>
                    <TranslatedText stringId="invoice.action.editItem" fallback="Edit invoice" />
                  </Button>
                  {activeModal === INVOICE_ACTIVE_MODALS.EDIT_INVOICE && <EditInvoiceModal
                    open={true}
                    invoiceId={invoice.id}
                    displayId={invoice.displayId}
                    encounterId={encounter.id}
                    invoiceStatus={invoice.status}
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
        </TabPane>}
    </>
  );
});
