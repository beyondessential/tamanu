import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';
import { Button, OutlinedButton } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { INVOICE_STATUSES } from '@tamanu/constants';
import PrintIcon from '@material-ui/icons/Print';
import CircularProgress from '@material-ui/core/CircularProgress';
import { isInvoiceEditable } from '@tamanu/shared/utils/invoice';
import {
  InvoiceModalGroup,
  InvoiceStatus,
  InvoiceForm,
  InvoiceSummaryPanel,
  PatientPaymentsTable,
  InsurerPaymentsTable,
} from '../../../features/Invoice';
import { ContentPane } from '../../../components/ContentPane';
import { INVOICE_MODAL_TYPES } from '../../../constants';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { useEncounterInvoiceQuery } from '../../../api/queries/useInvoiceQuery';
import { useAuth } from '../../../contexts/Auth';
import { NoteModalActionBlocker } from '../../../components';
import { usePatientDataQuery } from '../../../api/queries';
import { InvoiceRecordModal } from '../../../components/PatientPrinting/modals/InvoiceRecordModal';

const EmptyPane = styled(ContentPane)`
  text-align: center;
`;

const ActionsPane = styled.div`
  display: flex;
  align-items: center;

  .MuiButtonBase-root {
    margin-left: 8px;
  }
`;

const Menu = styled(ThreeDotMenu)`
  &.MuiButtonBase-root {
    margin-left: 0;
  }
`;

const InvoiceHeading = styled(Typography).attrs({ component: 'div' })`
  margin-left: 10px;
  display: flex;
  gap: 20px;
  align-items: center;
`;

const InvoiceTitle = styled(Typography)`
  color: ${props => props.theme.palette.text.primary};
  font-weight: 500;
  font-size: 18px;
`;

const InvoiceSubTitle = styled(Typography)`
  color: ${props => props.theme.palette.text.tertiary};
  font-size: 14px;
`;

const InvoiceTopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid ${Colors.outline};
`;

const InvoiceContainer = styled.div`
  padding: 8px;
  margin-bottom: 5px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
`;

const PrintButton = styled(OutlinedButton)`
  padding: 10px 16px;
  min-width: 100px;
  .MuiButton-startIcon {
    margin-right: 0;
  }
`;

const PaymentsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 8px;
`;

export const EncounterInvoicingPane = ({ encounter }) => {
  const { ability } = useAuth();
  const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const { data: invoice, isLoading } = useEncounterInvoiceQuery(encounter.id);
  const { data: patient } = usePatientDataQuery(encounter.patientId);

  const handleOpenInvoiceModal = type => setOpenInvoiceModal(type);

  const handleFinaliseInvoice = () => {
    handleOpenInvoiceModal(INVOICE_MODAL_TYPES.FINALISE_INVOICE);
  };

  const canWriteInvoice = ability.can('write', 'Invoice');
  const canDeleteInvoice = ability.can('delete', 'Invoice');
  const cancelable = invoice && isInvoiceEditable(invoice) && canWriteInvoice;
  const editable = invoice && isInvoiceEditable(invoice) && canWriteInvoice;
  const deletable = invoice && invoice.status !== INVOICE_STATUSES.FINALISED && canDeleteInvoice;
  const finalisable = invoice && invoice.status === INVOICE_STATUSES.IN_PROGRESS && canWriteInvoice;
  const insurancePlans = invoice?.insurancePlans.map(plan => plan.name).join(', ');

  if (isLoading) {
    return (
      <Box p={5} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
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
    );
  }

  return (
    <>
      <TabPane>
        <InvoiceContainer>
          <InvoiceTopBar>
            <InvoiceHeading>
              <Box>
                <InvoiceTitle>
                  <TranslatedText stringId="invoice.invoiceNumber" fallback="Invoice number" />:{' '}
                  {invoice.displayId}
                </InvoiceTitle>
                <InvoiceSubTitle>
                  {patient?.village?.name} {insurancePlans}
                </InvoiceSubTitle>
              </Box>
              <InvoiceStatus status={invoice.status} data-testid="invoicestatus-qb63" />
            </InvoiceHeading>
            {(cancelable || deletable) && (
              <ActionsPane data-testid="actionspane-l9ey">
                {finalisable && (
                  <NoteModalActionBlocker>
                    <OutlinedButton onClick={handleFinaliseInvoice} data-testid="button-yicz">
                      <TranslatedText
                        stringId="invoice.modal.finaliseButton.label"
                        fallback="Finalise"
                        data-testid="translatedtext-upzu"
                      />
                    </OutlinedButton>
                  </NoteModalActionBlocker>
                )}
                <NoteModalActionBlocker>
                  <Button
                    onClick={() => handleOpenInvoiceModal(INVOICE_MODAL_TYPES.INSURANCE)}
                    data-testid="button-insurance-2zyp"
                  >
                    <TranslatedText stringId="invoice.action.insurance" fallback="Insurance plan" />
                  </Button>
                </NoteModalActionBlocker>
                <NoteModalActionBlocker>
                  <Menu
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
                </NoteModalActionBlocker>
              </ActionsPane>
            )}
            {!editable && (
              <PrintButton onClick={() => setPrintModalOpen(true)} startIcon={<PrintIcon />}>
                <TranslatedText stringId="general.action.print" fallback="Print" />
              </PrintButton>
            )}
          </InvoiceTopBar>
          <InvoiceForm invoice={invoice} isPatientView={false} />
          {invoice.status !== INVOICE_STATUSES.IN_PROGRESS && (
            <PaymentsSection>
              <PatientPaymentsTable invoice={invoice} />
              <InvoiceSummaryPanel invoiceItems={invoice?.items} />
              <InsurerPaymentsTable invoice={invoice} />
            </PaymentsSection>
          )}
        </InvoiceContainer>
      </TabPane>
      {openInvoiceModal && (
        <InvoiceModalGroup
          initialModalType={openInvoiceModal}
          initialInvoice={invoice}
          encounterId={encounter.id}
          onClose={() => setOpenInvoiceModal()}
          data-testid="invoicemodalgroup-rx7c"
        />
      )}
      <InvoiceRecordModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        invoice={invoice}
        data-testid="invoicerecordmodal-ep8b"
      />
    </>
  );
};
