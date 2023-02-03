import React, { useState } from 'react';
import { ImagingRequestModal } from '../../../components/ImagingRequestModal';
import { ImagingRequestsTable } from '../../../components/ImagingRequestsTable';
import { PrintMultipleImagingRequestsSelectionModal } from '../../../components/PatientPrinting';
import { TableButtonRow, Button } from '../../../components';
import { TabPane } from '../components';

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
        >
          Print
        </Button>
        <Button onClick={() => setNewRequestModalOpen(true)} disabled={readonly}>
          New imaging request
        </Button>
      </TableButtonRow>
      <ImagingRequestsTable encounterId={encounter.id} />
    </TabPane>
  );
});
