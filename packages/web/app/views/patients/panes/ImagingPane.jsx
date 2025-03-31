import React, { useState } from 'react';
import { Button, ButtonWithPermissionCheck, TableButtonRow } from '../../../components';
import { ImagingRequestModal } from '../../../components/ImagingRequestModal';
import { ImagingRequestsTable } from '../../../components/ImagingRequestsTable';
import { PrintMultipleImagingRequestsSelectionModal } from '../../../components/PatientPrinting';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const ImagingPane = React.memo(({ encounter, readonly }) => {
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);
  const [printRequestsModalOpen, setPrintRequestsModalOpen] = useState(false);

  // TODO: should these be ButtonWithPermissionCheck?
  return (
    <TabPane>
      <ImagingRequestModal
        open={newRequestModalOpen}
        encounter={encounter}
        onClose={() => setNewRequestModalOpen(false)}
      />
      <PrintMultipleImagingRequestsSelectionModal
        encounter={encounter}
        open={printRequestsModalOpen}
        onClose={() => setPrintRequestsModalOpen(false)}
      />
      <TableButtonRow variant="small">
        <Button
          onClick={() => setPrintRequestsModalOpen(true)}
          disabled={readonly}
          variant="outlined"
          color="primary"
          data-test-id='button-r51k'>
          <TranslatedText
            stringId="general.action.print"
            fallback="Print"
            data-test-id='translatedtext-6mp4' />
        </Button>
        <ButtonWithPermissionCheck
          onClick={() => setNewRequestModalOpen(true)}
          disabled={readonly}
          verb="create"
          noun="ImagingRequest"
          data-test-id='buttonwithpermissioncheck-e7hl'>
          <TranslatedText
            stringId="imaging.action.create"
            fallback="New imaging request"
            data-test-id='translatedtext-cdvv' />
        </ButtonWithPermissionCheck>
      </TableButtonRow>
      <ImagingRequestsTable encounterId={encounter.id} />
    </TabPane>
  );
});
