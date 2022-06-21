import React, { useState } from 'react';
import { ImagingRequestModal } from '../../../components/ImagingRequestModal';
import { ImagingRequestsTable } from '../../../components/ImagingRequestsTable';
import { TableButtonRow, Button } from '../../../components';
import { TabPane } from '../components';

export const ImagingPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <TabPane>
      <ImagingRequestModal
        open={modalOpen}
        encounter={encounter}
        onClose={() => setModalOpen(false)}
      />
      <TableButtonRow variant="small">
        <Button onClick={() => setModalOpen(true)} disabled={readonly}>
          New imaging request
        </Button>
      </TableButtonRow>
      <ImagingRequestsTable encounterId={encounter.id} />
    </TabPane>
  );
});
