import React, { useState } from 'react';
import { ImagingRequestModal } from '../../../components/ImagingRequestModal';
import { ImagingRequestsTable } from '../../../components/ImagingRequestsTable';
import { ContentPane } from '../../../components/ContentPane';
import { Button } from '../../../components';

export const ImagingPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <ImagingRequestModal
        open={modalOpen}
        encounter={encounter}
        onClose={() => setModalOpen(false)}
      />
      <ImagingRequestsTable encounterId={encounter.id} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New imaging request
        </Button>
      </ContentPane>
    </div>
  );
});
