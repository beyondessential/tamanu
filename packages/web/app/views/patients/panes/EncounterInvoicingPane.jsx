import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { Button } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { isInvoiceEditable } from '@tamanu/shared/utils/invoice';
import { ContentPane } from '../../../components/ContentPane';
import { INVOICE_MODAL_TYPES } from '../../../constants';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { useEncounterInvoiceQuery } from '../../../api/queries/useInvoiceQuery';
import { useAuth } from '../../../contexts/Auth';
import { NoteModalActionBlocker } from '../../../components';
import {
  InvoiceStatus,
  InvoiceItemsTable,
  InvoiceSummaryPanel,
  InvoiceModalGroup,
} from '../../../features/Invoice';

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
        <TabPane data-testid="tabpane-3i52">
          <InvoiceContainer data-testid="invoicecontainer-8sm4">
            <InvoiceTopBar data-testid="invoicetopbar-96rq">
              <InvoiceHeading data-testid="invoiceheading-f1vs">
                <InvoiceTitle data-testid="invoicetitle-6asf">
                  <TranslatedText
                    stringId="invoice.invoiceNumber"
                    fallback="Invoice number"
                    data-testid="translatedtext-8m4h"
                  />
                  {`: ${invoice.displayId}`}
                </InvoiceTitle>
                <InvoiceStatus status={invoice.status} data-testid="invoicestatus-qb63" />
              </InvoiceHeading>
              {(cancelable || deletable) && (
                <ActionsPane data-testid="actionspane-l9ey">
                  <NoteModalActionBlocker>
                    <ThreeDotMenu
                      items={[
                        {
                          label: (
                            <TranslatedText
                              stringId="invoice.modal.editInvoice.cancelInvoice"
                              fallback="Cancel invoice"
                              data-testid="translatedtext-n7tk"
                            />
                          ),
                          onClick: () => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.CANCEL_INVOICE),
                          hidden: !cancelable,
                        },
                        {
                          label: (
                            <TranslatedText
                              stringId="invoice.modal.editInvoice.deleteInvoice"
                              fallback="Delete invoice"
                              data-testid="translatedtext-d2ou"
                            />
                          ),
                          onClick: () => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.DELETE_INVOICE),
                          hidden: !deletable,
                        },
                      ]}
                      data-testid="threedotmenu-5t9u"
                    />
                    <Button
                      onClick={() => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.INSURANCE)}
                      data-testid="button-insurance-2zyp"
                    >
                      <TranslatedText stringId="invoice.action.insurance" fallback="Insurance" />
                    </Button>
                    <Button
                      onClick={() => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.EDIT_INVOICE)}
                      data-testid="button-2zyp"
                    >
                      <TranslatedText
                        stringId="invoice.action.edit"
                        fallback="Edit invoice"
                        data-testid="translatedtext-6nrc"
                      />
                    </Button>
                  </NoteModalActionBlocker>
                </ActionsPane>
              )}
            </InvoiceTopBar>
            <InvoiceItemsTable invoice={invoice} data-testid="invoiceitemstable-86zi" />
          </InvoiceContainer>
          <InvoiceSummaryPanel invoice={invoice} data-testid="invoicesummarypanel-40qi" />
        </TabPane>
      ) : (
        <EmptyPane data-testid="emptypane-cjxo">
          {ability.can('create', 'Invoice') && (
            <NoteModalActionBlocker>
              <Button
                onClick={() => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.CREATE_INVOICE)}
                data-testid="button-j06y"
              >
                <TranslatedText
                  stringId="invoice.action.create"
                  fallback="Create invoice"
                  data-testid="translatedtext-um8m"
                />
              </Button>
            </NoteModalActionBlocker>
          )}
        </EmptyPane>
      )}
      {openInvoiceModal && (
        <InvoiceModalGroup
          initialModalType={openInvoiceModal}
          initialInvoice={invoice}
          encounterId={encounter.id}
          onClose={() => setOpenInvoiceModal()}
          data-testid="invoicemodalgroup-rx7c"
        />
      )}
    </>
  );
};
