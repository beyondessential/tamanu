import React, { useState } from 'react';
import { LabRequestModal } from '../../../components/LabRequestModal';
import { LabRequestsTable } from '../../../components/LabRequestsTable';
import { TableButtonRow, ButtonWithPermissionCheck } from '../../../components';
import { PrintMultipleLabRequestsSelectionModal } from '../../../components/PatientPrinting/PrintMultipleLabRequestsSelectionModal';
import { TabPane } from '../components';

export const LabsPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [printLabRequestsModalOpen, setPrintLabRequestsModalOpen] = useState(false);

  return (
    <TabPane>
      <LabRequestModal open={modalOpen} encounter={encounter} onClose={() => setModalOpen(false)} />
      <PrintMultipleLabRequestsSelectionModal
        encounter={encounter}
        open={printLabRequestsModalOpen}
        onClose={() => setPrintLabRequestsModalOpen(false)}
      />
      <TableButtonRow variant="small">
        <ButtonWithPermissionCheck
          onClick={() => setPrintLabRequestsModalOpen(true)}
          disabled={readonly}
          verb="read"
          noun="LabRequest"
          variant="outlined"
          color="primary"
        >
          Print
        </ButtonWithPermissionCheck>
        <ButtonWithPermissionCheck
          onClick={() => setModalOpen(true)}
          disabled={readonly}
          verb="create"
          noun="LabRequest"
        >
          New lab request
        </ButtonWithPermissionCheck>
      </TableButtonRow>
      <LabRequestsTable encounterId={encounter.id} />
    </TabPane>
  );
});
