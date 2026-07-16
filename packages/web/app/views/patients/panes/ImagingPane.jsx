import React, { useState } from 'react';
import styled from 'styled-components';

import { Button, ButtonWithPermissionCheck, TranslatedText } from '@tamanu/ui-components';
import { NoteModalActionBlocker, TableButtonRow } from '../../../components';
import { ImagingRequestModal } from '../../../components/ImagingRequestModal';
import { ImagingRequestsTable } from '../../../components/ImagingRequestsTable';
import { PrintMultipleImagingRequestsSelectionModal } from '../../../components/PatientPrinting';
import { TabPane } from '../components';

const StyledImagingRequestsTable = styled(ImagingRequestsTable)`
  border-block-start: 1px solid ${p => p.theme.palette.divider};
  border-start-end-radius: ${p => p.theme.shape.borderRadius}px;
  border-start-start-radius: ${p => p.theme.shape.borderRadius}px;
`;

export const ImagingPane = React.memo(({ encounter, readonly }) => {
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);
  const [printRequestsModalOpen, setPrintRequestsModalOpen] = useState(false);

  // TODO: should these be ButtonWithPermissionCheck?
  return (
    <TabPane data-testid="tabpane-oxfj">
      <ImagingRequestModal
        open={newRequestModalOpen}
        encounter={encounter}
        onClose={() => setNewRequestModalOpen(false)}
        data-testid="imagingrequestmodal-p374"
      />
      <PrintMultipleImagingRequestsSelectionModal
        encounter={encounter}
        open={printRequestsModalOpen}
        onClose={() => setPrintRequestsModalOpen(false)}
        data-testid="printmultipleimagingrequestsselectionmodal-tm3j"
      />
      <TableButtonRow variant="small" data-testid="tablebuttonrow-4ald">
        <NoteModalActionBlocker>
          <Button
            onClick={() => setPrintRequestsModalOpen(true)}
            disabled={readonly}
            variant="outlined"
            color="primary"
            data-testid="button-21bg"
          >
            <TranslatedText
              stringId="general.action.print"
              fallback="Print"
              data-testid="translatedtext-iujx"
            />
          </Button>
        </NoteModalActionBlocker>
        <NoteModalActionBlocker>
          <ButtonWithPermissionCheck
            onClick={() => setNewRequestModalOpen(true)}
            disabled={readonly}
            verb="create"
            noun="ImagingRequest"
            data-testid="buttonwithpermissioncheck-14hy"
          >
            <TranslatedText
              stringId="imaging.action.create"
              fallback="New imaging request"
              data-testid="translatedtext-hml5"
            />
          </ButtonWithPermissionCheck>
        </NoteModalActionBlocker>
      </TableButtonRow>
      <StyledImagingRequestsTable
        data-testid="imagingrequeststable-csir"
        encounterId={encounter.id}
      />
    </TabPane>
  );
});
