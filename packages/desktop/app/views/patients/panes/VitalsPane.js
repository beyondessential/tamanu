import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { VitalsModal } from '../../../components/VitalsModal';
import { VitalsTable } from '../../../components/VitalsTable';
import { ContentPane } from '../../../components/ContentPane';
import { Button } from '../../../components';

export const VitalsPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  return (
    <div>
      <VitalsModal
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <VitalsTable />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          Record vitals
        </Button>
      </ContentPane>
    </div>
  );
});
