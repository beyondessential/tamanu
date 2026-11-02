import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ButtonWithPermissionCheck } from '@tamanu/ui-components';
import { ENCOUNTER_PRINTOUT_LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { route } from '@tamanu/api-client';
import { LabRequestModal } from '../../../components/LabRequestModal';
import { EncounterLabRequestsTable } from '../EncounterLabRequestsTable';
import { MenuButton, TableButtonRow, NoteModalActionBlocker } from '../../../components';
import {
  LabResultsPrintoutModal,
  PrintMultipleLabRequestsSelectionModal,
} from '../../../components/PatientPrinting';
import { TabPane } from '../components';
import { useRefreshCount } from '../../../hooks/useRefreshCount';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { usePatient } from '../../../contexts/Patient';
import { useSettings } from '../../../contexts/Settings';

// Every permission the printout's own fetches enforce: the list it is built from, each request's
// tests, and the results themselves. Reading the status log is deliberately absent — that fetch
// degrades to "n/a" rather than blocking the document, so it must not hide the action either.
const RESULTS_PRINTOUT_PERMISSIONS = [
  ['read', 'LabTestResult'],
  ['read', 'LabRequest'],
  ['list', 'LabRequest'],
  ['list', 'LabTest'],
];

// The requests the results printout covers: resulted, and not sensitive — sensitive requests are
// left out for every user, so they are printed from the request itself. Keyed on refreshCount for
// the same reason the table takes it: this endpoint is self-fetched, so invalidating the encounter
// query doesn't reach it, and a newly published request must reach the printout as well as the table.
//
// Unpaged on purpose. The server drops sensitive requests after the page is cut, so asking for one
// row to test "is anything eligible" would answer no whenever that row happened to be sensitive.
// The printout reads the same cached response, so fetching it all costs nothing extra at print time.
const usePrintableLabRequestsQuery = (encounterId, refreshCount, { enabled }) => {
  const api = useApi();
  return useQuery(
    ['encounterPrintableLabRequests', encounterId, refreshCount],
    () =>
      api.get(route('encounter/:encounterId/labRequests', { encounterId }), {
        status: ENCOUNTER_PRINTOUT_LAB_REQUEST_STATUSES,
        excludeSensitive: true,
        orderBy: 'requestedDate',
        order: 'ASC',
      }),
    { enabled },
  );
};

export const LabsPane = React.memo(({ encounter, readonly }) => {
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);
  const [printRequestsModalOpen, setPrintRequestsModalOpen] = useState(false);
  const [printResultsModalOpen, setPrintResultsModalOpen] = useState(false);
  // The table fetches its own endpoint, so invalidating the encounter query doesn't reach it.
  const [refreshCount, updateRefreshCount] = useRefreshCount();

  const { ability } = useAuth();
  const { patient } = usePatient();
  const { getSetting } = useSettings();

  const isResultsPrintoutEnabled =
    getSetting('features.labRequest.enableLabResultsPrintout') &&
    RESULTS_PRINTOUT_PERMISSIONS.every(([verb, noun]) => ability?.can(verb, noun));
  const { data: printableLabRequests } = usePrintableLabRequestsQuery(encounter.id, refreshCount, {
    enabled: isResultsPrintoutEnabled,
  });
  const canPrintResults = printableLabRequests?.data?.length > 0;

  const menuActions = canPrintResults
    ? [
        {
          label: (
            <TranslatedText
              stringId="lab.action.printResults"
              fallback="Print results"
              data-testid="translatedtext-print-results"
            />
          ),
          action: () => setPrintResultsModalOpen(true),
        },
      ]
    : [];

  return (
    <TabPane data-testid="tabpane-zm0o">
      <LabRequestModal
        open={newRequestModalOpen}
        encounter={encounter}
        onClose={() => {
          setNewRequestModalOpen(false);
          updateRefreshCount();
        }}
        data-testid="labrequestmodal-axnl"
      />
      <PrintMultipleLabRequestsSelectionModal
        encounter={encounter}
        open={printRequestsModalOpen}
        onClose={() => setPrintRequestsModalOpen(false)}
        data-testid="printmultiplelabrequestsselectionmodal-hccp"
      />
      {/* Mounted only while open: the printout fetches each request's tests and publication. */}
      {printResultsModalOpen && (
        <LabResultsPrintoutModal
          open
          labRequests={printableLabRequests.data}
          patient={patient}
          onClose={() => setPrintResultsModalOpen(false)}
          data-testid="labresultsprintoutmodal-encounter"
        />
      )}
      <TableButtonRow variant="small" data-testid="tablebuttonrow-yf2d">
        <NoteModalActionBlocker>
          <ButtonWithPermissionCheck
            onClick={() => setPrintRequestsModalOpen(true)}
            disabled={readonly}
            verb="read"
            noun="LabRequest"
            variant="outlined"
            color="primary"
            size="small"
            data-testid="buttonwithpermissioncheck-hjef"
          >
            <TranslatedText
              stringId="lab.action.print"
              fallback="Print"
              data-testid="translatedtext-923g"
            />
          </ButtonWithPermissionCheck>
        </NoteModalActionBlocker>
        <NoteModalActionBlocker>
          <ButtonWithPermissionCheck
            onClick={() => setNewRequestModalOpen(true)}
            disabled={readonly}
            verb="create"
            noun="LabRequest"
            size="small"
            data-testid="buttonwithpermissioncheck-kcrs"
          >
            <TranslatedText
              stringId="lab.action.create"
              fallback="New lab request"
              data-testid="translatedtext-5yxa"
            />
          </ButtonWithPermissionCheck>
        </NoteModalActionBlocker>
        {menuActions.length > 0 && (
          <MenuButton
            a11yLabel={<TranslatedText stringId="lab.actions" fallback="Lab request actions" />}
            actions={menuActions}
            data-testid="menubutton-labs-pane"
          />
        )}
      </TableButtonRow>
      <EncounterLabRequestsTable
        encounterId={encounter.id}
        refreshCount={refreshCount}
        data-testid="encounterlabrequeststable-hd7x"
      />
    </TabPane>
  );
});
