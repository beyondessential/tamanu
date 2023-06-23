import React, { useState } from 'react';
import { useEncounter } from '../../../contexts/Encounter';
import { NotePageModal } from '../../../components/NotePageModal';
import { NotePageTableWithPermission } from '../../../components/NotePageTable';
import { ButtonWithPermissionCheck, TableButtonRow } from '../../../components';
import { TabPane } from '../components';

export const NotesPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { loadEncounter } = useEncounter();

  return (
    <TabPane>
      <NotePageModal
        title="New note"
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
          verb="create"
          noun="EncounterNote"
        >
          New note
        </ButtonWithPermissionCheck>
      </TableButtonRow>
      <NotePageTableWithPermission encounterId={encounter.id} verb="write" noun="EncounterNote" />
    </TabPane>
  );
});
