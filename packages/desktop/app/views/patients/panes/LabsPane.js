import React, { useState } from 'react';
import { LabRequestModal } from '../../../components/LabRequestModal';
import { LabRequestsTable } from '../../../components/LabRequestsTable';
import { ContentPane } from '../../../components/ContentPane';
import { Button } from '../../../components';

export const LabsPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <LabRequestModal open={modalOpen} encounter={encounter} onClose={() => setModalOpen(false)} />
      <LabRequestsTable encounterId={encounter.id} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New lab request
        </Button>
      </ContentPane>
    </div>
  );
});
