import React, { useState } from 'react';
import { ButtonWithPermissionCheck } from '@tamanu/ui-components';
import { LabRequestModal } from '../../../components/LabRequestModal';
import { EncounterLabRequestsTable } from '../EncounterLabRequestsTable';
import {
  TableButtonRow,
  NoteModalActionBlocker,
} from '../../../components';
import { PrintMultipleLabRequestsSelectionModal } from '../../../components/PatientPrinting';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const LabsPane = React.memo(({ encounter, readonly }) => {
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);
  const [printRequestsModalOpen, setPrintRequestsModalOpen] = useState(false);

  return (
    <TabPane data-testid="tabpane-zm0o">
      <LabRequestModal
        open={newRequestModalOpen}
        encounter={encounter}
        onClose={() => setNewRequestModalOpen(false)}
        data-testid="labrequestmodal-axnl"
      />
      <PrintMultipleLabRequestsSelectionModal
        encounter={encounter}
        open={printRequestsModalOpen}
        onClose={() => setPrintRequestsModalOpen(false)}
        data-testid="printmultiplelabrequestsselectionmodal-hccp"
      />
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
      </TableButtonRow>
      <EncounterLabRequestsTable
        encounterId={encounter.id}
        data-testid="encounterlabrequeststable-hd7x"
      />
    </TabPane>
  );
});
