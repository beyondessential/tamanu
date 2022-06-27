import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { NoteModal } from '../../../components/NoteModal';
import { NoteTable } from '../../../components/NoteTable';
import { Button, TableButtonRow } from '../../../components';
import { TabPane } from '../components';

export const NotesPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  return (
    <TabPane>
      <NoteModal
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
          New note
        </Button>
      </TableButtonRow>
      <NoteTable encounterId={encounter.id} />
    </TabPane>
  );
});
