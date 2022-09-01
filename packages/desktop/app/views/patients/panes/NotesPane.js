import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { NotePageModal } from '../../../components/NotePageModal';
import { NotePageTable } from '../../../components/NotePageTable';
import { ButtonWithPermissionCheck, TableButtonRow } from '../../../components';
import { TabPane } from '../components';

export const NotesPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  return (
    <TabPane>
      <NotePageModal
        title="New Note"
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await loadEncounter(encounter.id);
        }}
      />
      <TableButtonRow variant="small">
        <ButtonWithPermissionCheck
          onClick={() => setModalOpen(true)}
          disabled={readonly}
          verb="write"
          noun="Encounter"
        >
          New note
        </ButtonWithPermissionCheck>
      </TableButtonRow>
      <NotePageTable encounterId={encounter.id} />
    </TabPane>
  );
});
