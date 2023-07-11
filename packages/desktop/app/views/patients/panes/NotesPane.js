import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { NoteModal } from '../../../components/NoteModal';
import { NoteTableWithPermission } from '../../../components/NoteTable';
import { ButtonWithPermissionCheck, TableButtonRow } from '../../../components';
import { TabPane } from '../components';

export const NotesPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  const noteModalOnSaved = async () => {
    setModalOpen(false);
    await loadEncounter(encounter.id);
  };

  return (
    <TabPane>
      <NoteModal
        title="New note"
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={noteModalOnSaved}
        confirmText="Add note"
      />
      <TableButtonRow variant="small">
        <ButtonWithPermissionCheck
          onClick={() => setModalOpen(true)}
          disabled={readonly}
          verb="create"
          noun="EncounterNote"
        >
          New note
        </ButtonWithPermissionCheck>
      </TableButtonRow>
      <NoteTableWithPermission
        encounterId={encounter.id}
        verb="write"
        noun="EncounterNote"
        noteModalOnSaved={noteModalOnSaved}
      />
    </TabPane>
  );
});
