import React, { useState } from 'react';
import styled from 'styled-components';

import { useEncounter } from '../../../contexts/Encounter';
import { NoteModal } from '../../../components/NoteModal';
import { NoteTableWithPermission } from '../../../components/NoteTable';
import { ButtonWithPermissionCheck, TableButtonRow } from '../../../components';
import { TabPane } from '../components';
import { SelectInput } from '../../../components/Field';
import { NOTE_FORM_MODES, noteTypes } from '../../../constants';
import { useEncounterNotes } from '../../../contexts/EncounterNotes';

const StyledSelectInput = styled(SelectInput)`
  width: 200px;
`;

export const NotesPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { noteType, setNoteType } = useEncounterNotes();
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
        noteFormMode={NOTE_FORM_MODES.CREATE_NOTE}
      />
      <TableButtonRow variant="small" justifyContent="space-between">
        <StyledSelectInput
          options={[{ value: null, label: 'All' }, ...noteTypes]}
          onChange={e => setNoteType(e.target.value)}
          value={noteType}
          isClearable={false}
        />
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
        noteType={noteType}
      />
    </TabPane>
  );
});
