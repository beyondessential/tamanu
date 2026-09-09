import React, { useState } from 'react';
import styled from 'styled-components';
import { ButtonWithPermissionCheck } from '@tamanu/ui-components';
import { NoteTableWithPermission } from '../../../components/NoteTable';
import { NotesSearchBar } from '../../../components/SearchBar';
import { TabPane } from '../components';
import { Colors, NOTE_FORM_MODES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useNoteModal } from '../../../contexts/NoteModal';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';

const NotesCard = styled.div`
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  background: ${Colors.white};
`;

export const NotesPane = React.memo(({ encounter, readonly }) => {
  // Filters are intentionally kept in local state so they reset whenever the user
  // navigates away from and back to the notes pane. Saving a note refreshes the
  // table via refreshCount rather than reloading the encounter, so the pane stays
  // mounted and the current filters are preserved.
  const [searchParameters, setSearchParameters] = useState({});
  const [refreshCount, setRefreshCount] = useState(0);
  const { openNoteModal, updateNoteModalProps } = useNoteModal();

  const noteModalOnSaved = async createdNote => {
    updateNoteModalProps({ note: createdNote });
    setRefreshCount(count => count + 1);
  };

  const handleOpenNewNote = () => {
    openNoteModal({
      title: <TranslatedText stringId="note.modal.create.title" fallback="New note" />,
      encounterId: encounter.id,
      onSaved: noteModalOnSaved,
      confirmText: <TranslatedText stringId="note.action.add" fallback="Add note" />,
      noteFormMode: NOTE_FORM_MODES.CREATE_NOTE,
    });
  };

  return (
    <TabPane>
      <NotesCard>
        <NotesSearchBar
          searchParameters={searchParameters}
          setSearchParameters={setSearchParameters}
          extraActions={
            <NoteModalActionBlocker>
              <ButtonWithPermissionCheck
                onClick={handleOpenNewNote}
                disabled={readonly}
                verb="create"
                noun="EncounterNote"
                data-testid="buttonwithpermissioncheck-qbou"
              >
                <TranslatedText
                  stringId="note.action.new"
                  fallback="New note"
                  data-testid="translatedtext-r2fu"
                />
              </ButtonWithPermissionCheck>
            </NoteModalActionBlocker>
          }
        />
        <NoteTableWithPermission
          encounterId={encounter.id}
          verb="write"
          noun="EncounterNote"
          searchParameters={searchParameters}
          refreshCount={refreshCount}
          noteModalOnSaved={noteModalOnSaved}
          data-testid="notetablewithpermission-ngp2"
        />
      </NotesCard>
    </TabPane>
  );
});
