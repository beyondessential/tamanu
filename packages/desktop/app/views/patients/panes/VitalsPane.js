import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VitalsModal } from '../../../components/VitalsModal';
import { VitalsTable } from '../../../components/VitalsTable';
import { TableButtonRow, Button } from '../../../components';
import { TabPane } from '../components';

export const VitalsPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  return (
    <TabPane>
      <VitalsModal
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          queryClient.invalidateQueries(['encounterVitals', encounter.id]);
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
