import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { isInvoiceEditable } from '@tamanu/shared/utils/invoice';
import { InvoiceItemsTable } from '../../../components/Invoice/InvoiceItemsTable';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { Colors, INVOICE_MODAL_TYPES } from '../../../constants';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { InvoiceStatus } from '../../../components/Invoice/InvoiceStatus';
import { InvoiceSummaryPanel } from '../../../components/Invoice/InvoiceSummaryPanel';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { useEncounterInvoice } from '../../../api/queries/useInvoiceQuery';
import { InvoiceModalGroup } from '../../../components/Invoice/InvoiceModalGroup';
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

export const EncounterInvoicingPane = ({ encounter }) => {
  const { ability } = useAuth();
  const [openInvoiceModal, setOpenInvoiceModal] = useState();

  const { data: invoice } = useEncounterInvoice(encounter.id);

  const handleOpenInvoiceModal = type => setOpenInvoiceModal(type);

  return (
    <>
      {invoice ? (
        <TabPane>
          <InvoiceContainer>
            <InvoiceTopBar>
              <InvoiceHeading>
                <InvoiceTitle>
                  <TranslatedText stringId="invoice.invoiceNumber" fallback="Invoice number" />
                  {`: ${invoice.displayId}`}
                </InvoiceTitle>
                <InvoiceStatus status={invoice.status} />
              </InvoiceHeading>
              {isInvoiceEditable(invoice) && ability.can('write', 'Invoice') && (
                <ActionsPane>
                  <ThreeDotMenu
                    items={[
                      {
                        label: (
                          <TranslatedText
                            stringId="invoice.modal.editInvoice.cancelInvoice"
                            fallback="Cancel invoice"
                          />
                        ),
                        onClick: () => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.CANCEL_INVOICE),
                      },
                    ]}
                  />
                  <Button onClick={() => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.EDIT_INVOICE)}>
                    <TranslatedText stringId="invoice.action.edit" fallback="Edit invoice" />
                  </Button>
                </ActionsPane>
              )}
            </InvoiceTopBar>
            <InvoiceItemsTable invoice={invoice} />
          </InvoiceContainer>
          <InvoiceSummaryPanel invoice={invoice} />
        </TabPane>
      ) : (
        <EmptyPane>
          {ability.can('create', 'Invoice') && (
            <Button onClick={() => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.CREATE_INVOICE)}>
              <TranslatedText stringId="invoice.action.create" fallback="Create invoice" />
            </Button>
          )}
        </EmptyPane>
      )}
      <InvoiceModalGroup
        initialModalType={openInvoiceModal}
        initialInvoice={invoice}
        encounterId={encounter.id}
        onClose={() => setOpenInvoiceModal()}
      />
    </>
  );
};
