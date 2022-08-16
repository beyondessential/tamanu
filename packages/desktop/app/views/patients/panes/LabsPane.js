import React, { useState } from 'react';
import { LabRequestModal } from '../../../components/LabRequestModal';
import { LabRequestsTable } from '../../../components/LabRequestsTable';
import { TableButtonRow, ButtonWithPermissionCheck } from '../../../components';
import { TabPane } from '../components';

export const LabsPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <TabPane>
      <LabRequestModal open={modalOpen} encounter={encounter} onClose={() => setModalOpen(false)} />
      <TableButtonRow variant="small">
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
