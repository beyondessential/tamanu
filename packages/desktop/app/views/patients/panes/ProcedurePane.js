import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { ProcedureModal } from '../../../components/ProcedureModal';
import { ProcedureTable } from '../../../components/ProcedureTable';
import { ContentPane } from '../../../components/ContentPane';
import { Button } from '../../../components';

export const ProcedurePane = React.memo(({ encounter, readonly }) => {
  const [editedProcedure, setEditedProcedure] = useState(null);
  const { loadEncounter } = useEncounter();

  return (
    <div>
      <ProcedureModal
        editedProcedure={editedProcedure}
        encounterId={encounter.id}
        onClose={() => setEditedProcedure(null)}
        onSaved={async () => {
          setEditedProcedure(null);
          await loadEncounter(encounter.id);
        }}
      />
      <ProcedureTable encounterId={encounter.id} onItemClick={item => setEditedProcedure(item)} />
      <ContentPane>
        <Button
          onClick={() => setEditedProcedure({})}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New procedure
        </Button>
      </ContentPane>
    </div>
  );
});
