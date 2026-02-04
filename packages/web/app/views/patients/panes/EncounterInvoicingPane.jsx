import React, { useState } from 'react';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';
import { Button, OutlinedButton } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { INVOICE_STATUSES } from '@tamanu/constants';
import PrintIcon from '@material-ui/icons/Print';
import CircularProgress from '@material-ui/core/CircularProgress';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
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
import {
  useCreateInvoice,
  useBulkUpdateInvoiceItemApproval,
} from '../../../api/mutations/useInvoiceMutation';

const EmptyPane = styled(ContentPane)`
  text-align: center;
`;

const ActionsPane = styled.div`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
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
  // Triggers a horizontal scroll bar on the parent
  min-width: 700px;
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
  grid-template-columns: 1fr 220px;
  gap: 8px;

  @media (min-width: 1600px) {
    grid-template-columns: 1fr 320px;
  }

  @media (min-width: 2000px) {
    grid-template-columns: 1fr 420px;
  }
`;

const InvoiceMenu = ({ encounter, invoice, setInvoiceModalType, setEditing, isEditing }) => {
  const { ability } = useAuth();
  const canCreateInvoice = ability.can('create', 'Invoice');
  const canWriteInvoice = ability.can('write', 'Invoice');
  const canDeleteInvoice = ability.can('delete', 'Invoice');

  const hasPayments = invoice.payments?.length > 0;
  const isInProgress = invoice.status === INVOICE_STATUSES.IN_PROGRESS;
  const isCancelled = invoice.status === INVOICE_STATUSES.CANCELLED;
  const cancelable = invoice && isInvoiceEditable(invoice) && canWriteInvoice && !hasPayments;
  const deletable =
    invoice && invoice.status !== INVOICE_STATUSES.FINALISED && canDeleteInvoice && !hasPayments;
  const { mutate: bulkUpdateApproval } = useBulkUpdateInvoiceItemApproval(invoice);
  const finalisable =
    invoice && isInvoiceEditable(invoice) && canCreateInvoice && encounter.endDate;
  const allItemsAreApproved = invoice.items.every(item => item.approved);
  const zeroItems = invoice.items.length === 0;

  const handleAllApprovals = approved => {
    bulkUpdateApproval({ approved });
  };

  const ACTIONS = [
    {
      label: (
        <TranslatedText
          stringId="invoice.modal.editInvoice.cancelInvoice"
          fallback="Cancel invoice"
          data-testid="translatedtext-n7tk"
        />
      ),
      onClick: () => setInvoiceModalType(INVOICE_MODAL_TYPES.CANCEL_INVOICE),
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
      onClick: () => setInvoiceModalType(INVOICE_MODAL_TYPES.DELETE_INVOICE),
      hidden: !deletable,
    },
    {
      label: (
        <TranslatedText
          stringId="invoice.editInvoice.removeAllApprovals"
          fallback="Remove all approvals"
          data-testid="translatedtext-k3ds"
        />
      ),
      onClick: () => handleAllApprovals(false),
      hidden: !allItemsAreApproved || isCancelled || zeroItems,
    },
    {
      label: (
        <TranslatedText
          stringId="invoice.editInvoice.markAllAsApproved"
          fallback="Mark all as approved"
          data-testid="translatedtext-95jh"
        />
      ),
      onClick: () => handleAllApprovals(true),
      hidden: allItemsAreApproved || isCancelled,
    },
    {
      label: (
        <TranslatedText
          stringId="invoice.editInvoice.printInvoice"
          fallback="Print invoice"
          data-testid="translatedtext-31yh"
        />
      ),
      onClick: () => setInvoiceModalType(INVOICE_MODAL_TYPES.PRINT),
      hidden: !isInProgress,
    },
  ];

  if (!isEditing && !zeroItems) {
    ACTIONS.unshift({
      label: (
        <TranslatedText
          stringId="invoice.modal.editInvoice.editItems"
          fallback="Edit items"
          data-testid="edit-invoice-items-n7tk"
        />
      ),
      onClick: () => setEditing(true),
      hidden: !isInvoiceEditable(invoice),
    });
  }

  const hasVisibleActions = ACTIONS.some(action => !action.hidden);

  return (
    <ActionsPane data-testid="actionspane-l9ey">
      {hasVisibleActions && (
        <NoteModalActionBlocker>
          <ThreeDotMenu items={ACTIONS} data-testid="threedotmenu-5t9u" />
        </NoteModalActionBlocker>
      )}
      {!isInProgress && (
        <PrintButton
          onClick={() => setInvoiceModalType(INVOICE_MODAL_TYPES.PRINT)}
          startIcon={<PrintIcon />}
        >
          <TranslatedText stringId="general.action.print" fallback="Print" />
        </PrintButton>
      )}
      {isInProgress && (
        <NoteModalActionBlocker>
          <Button
            onClick={() => setInvoiceModalType(INVOICE_MODAL_TYPES.INSURANCE)}
            data-testid="button-insurance-2zyp"
          >
            <TranslatedText stringId="invoice.action.insurance" fallback="Insurance plan" />
          </Button>
        </NoteModalActionBlocker>
      )}
      {finalisable && (
        <NoteModalActionBlocker>
          <OutlinedButton
            onClick={() => setInvoiceModalType(INVOICE_MODAL_TYPES.FINALISE_INVOICE)}
            style={{ marginRight: 10 }}
            data-testid="button-yicz"
          >
            <TranslatedText stringId="invoice.action.finalise" fallback="Finalise" />
          </OutlinedButton>
        </NoteModalActionBlocker>
      )}
    </ActionsPane>
  );
};

export const EncounterInvoicingPane = ({ encounter }) => {
  const { ability } = useAuth();
  const [isEditing, setEditing] = useState(false);
  const [invoiceModalType, setInvoiceModalType] = useState(null);
  const { data: invoice, isLoading } = useEncounterInvoiceQuery(encounter.id);
  const { data: patient } = usePatientDataQuery(encounter.patientId);
  const { mutate: createInvoice, isLoading: isSubmitting } = useCreateInvoice();

  const handleCreateInvoice = () => {
    createInvoice({
      encounterId: encounter.id,
      date: getCurrentDateTimeString(),
    });
  };

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
              onClick={() => handleCreateInvoice()}
              isSubmitting={isSubmitting}
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

  const isInProgress = invoice.status === INVOICE_STATUSES.IN_PROGRESS;

  return (
    <>
      <TabPane style={{ overflow: 'auto' }}>
        <InvoiceContainer>
          <InvoiceTopBar>
            <InvoiceHeading>
              <Box>
                <InvoiceTitle>
                  <TranslatedText stringId="invoice.invoiceNumber" fallback="Invoice number" />:{' '}
                  {invoice.displayId}
                </InvoiceTitle>
                <InvoiceSubTitle>
                  {patient?.village?.name} {invoice.priceList?.name}
                </InvoiceSubTitle>
              </Box>
              <InvoiceStatus status={invoice.status} data-testid="invoicestatus-qb63" />
            </InvoiceHeading>
            <InvoiceMenu
              encounter={encounter}
              invoice={invoice}
              setInvoiceModalType={setInvoiceModalType}
              setEditing={setEditing}
              isEditing={isEditing}
            />
          </InvoiceTopBar>
          <InvoiceForm
            invoice={invoice}
            isPatientView={false}
            isEditing={isEditing}
            setIsEditing={setEditing}
          />
          <PaymentsSection>
            <PatientPaymentsTable invoice={invoice} />
            <InvoiceSummaryPanel invoice={invoice} />
            {!isInProgress && <InsurerPaymentsTable invoice={invoice} />}
          </PaymentsSection>
        </InvoiceContainer>
      </TabPane>
      <InvoiceModalGroup
        invoiceModalType={invoiceModalType}
        invoice={invoice}
        setOpenInvoiceModal={setInvoiceModalType}
      />
    </>
  );
};
