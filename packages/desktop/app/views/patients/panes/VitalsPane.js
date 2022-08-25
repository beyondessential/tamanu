import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { VitalsModal } from '../../../components/VitalsModal';
import { VitalsTable } from '../../../components/VitalsTable';
import { TableButtonRow, Button } from '../../../components';
import { TabPane } from '../components';

export const VitalsPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  return (
    <TabPane>
      <VitalsModal
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <TableButtonRow variant="small">
        <Button onClick={() => setModalOpen(true)} disabled={readonly}>
          Record vitals
        </Button>
      </TableButtonRow>
      <VitalsTable />
    </TabPane>
  );
});
