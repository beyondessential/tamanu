import React, { useState } from 'react';
import { Button, TableButtonRow } from '../../../components';
import { ProcedureModal } from '../../../components/ProcedureModal';
import { ProcedureTable } from '../../../components/ProcedureTable';
import { useEncounter } from '../../../contexts/Encounter';
import { TabPane } from '../components';

export const ProcedurePane = React.memo(({ encounter, readonly }) => {
  const [editedProcedure, setEditedProcedure] = useState(null);
  const { loadEncounter } = useEncounter();

  return (
    <TabPane>
      <ProcedureModal
        editedProcedure={editedProcedure}
        encounterId={encounter.id}
        onClose={() => setEditedProcedure(null)}
        onSaved={async () => {
          setEditedProcedure(null);
          await loadEncounter(encounter.id);
        }}
      />
      <TableButtonRow variant="small">
        <Button onClick={() => setEditedProcedure({})} disabled={readonly}>
          New procedure
        </Button>
      </TableButtonRow>
      <ProcedureTable encounterId={encounter.id} onItemClick={item => setEditedProcedure(item)} />
    </TabPane>
  );
});
