import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { INVOICE_STATUSES } from '@tamanu/constants';
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
import { useEncounterInvoiceQuery } from '../../../api/queries/useInvoiceQuery';
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

const InvoiceHeading = styled(Typography).attrs({ component: 'div' })`
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

  const { data: invoice } = useEncounterInvoiceQuery(encounter.id);

  const handleOpenInvoiceModal = type => setOpenInvoiceModal(type);

  const canWriteInvoice = ability.can('write', 'Invoice');
  const canDeleteInvoice = ability.can('delete', 'Invoice');
  const cancelable = invoice && isInvoiceEditable(invoice) && canWriteInvoice;
  const deletable = invoice && invoice.status !== INVOICE_STATUSES.FINALISED && canDeleteInvoice;

  return (
    <>
      {invoice ? (
        <TabPane>
          <InvoiceContainer>
            <InvoiceTopBar>
              <InvoiceHeading>
                <InvoiceTitle>
                  <TranslatedText
                    stringId="invoice.invoiceNumber"
                    fallback="Invoice number"
                    data-testid='translatedtext-p1ag' />
                  {`: ${invoice.displayId}`}
                </InvoiceTitle>
                <InvoiceStatus status={invoice.status} />
              </InvoiceHeading>
              {(cancelable || deletable) && (
                <ActionsPane>
                  <ThreeDotMenu
                    items={[
                      {
                        label: (
                          <TranslatedText
                            stringId="invoice.modal.editInvoice.cancelInvoice"
                            fallback="Cancel invoice"
                            data-testid='translatedtext-e8px' />
                        ),
                        onClick: () => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.CANCEL_INVOICE),
                        hidden: !cancelable,
                      },
                      {
                        label: (
                          <TranslatedText
                            stringId="invoice.modal.editInvoice.deleteInvoice"
                            fallback="Delete invoice"
                            data-testid='translatedtext-u80n' />
                        ),
                        onClick: () => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.DELETE_INVOICE),
                        hidden: !deletable,
                      },
                    ]}
                  />
                  <Button
                    onClick={() => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.EDIT_INVOICE)}
                    data-testid='button-5wza'>
                    <TranslatedText
                      stringId="invoice.action.edit"
                      fallback="Edit invoice"
                      data-testid='translatedtext-4o6c' />
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
            <Button
              onClick={() => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.CREATE_INVOICE)}
              data-testid='button-5fke'>
              <TranslatedText
                stringId="invoice.action.create"
                fallback="Create invoice"
                data-testid='translatedtext-v4ik' />
            </Button>
          )}
        </EmptyPane>
      )}
      {openInvoiceModal && (
        <InvoiceModalGroup
          initialModalType={openInvoiceModal}
          initialInvoice={invoice}
          encounterId={encounter.id}
          onClose={() => setOpenInvoiceModal()}
        />
      )}
    </>
  );
};
