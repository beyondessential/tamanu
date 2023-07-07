import React, { useState } from 'react';
import styled from 'styled-components';

import { useEncounter } from '../../../contexts/Encounter';
import { NotePageModal } from '../../../components/NotePageModal';
import { TableButtonRow } from '../../../components';
import { TabPane } from '../components';
import { SelectInput } from '../../../components/Field';
import { noteTypes } from '../../../constants';
import { useEncounterNotes } from '../../../contexts/EncounterNotes';

const StyledSelectInput = styled(SelectInput)`
  width: 200px;
`;

export const NotesPane = React.memo(({ encounter }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { noteType, setNoteType } = useEncounterNotes();
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
      <TableButtonRow variant="small" justifyContent="space-between">
        <StyledSelectInput
          options={noteTypes}
          onChange={e => setNoteType(e.target.value)}
          value={noteType}
          isClearable={false}
        />
        {/* <ButtonWithPermissionCheck
          onClick={() => setModalOpen(true)}
          disabled={readonly}
          verb="create"
          noun="EncounterNote"
        >
          New note
        </ButtonWithPermissionCheck> */}
      </TableButtonRow>
      {/* <NotePageTableWithPermission
        noteType={noteType}
        encounterId={encounter.id}
        verb="write"
        noun="EncounterNote"
      /> */}
    </TabPane>
  );
});
