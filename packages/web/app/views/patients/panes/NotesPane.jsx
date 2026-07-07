import React, { useState } from 'react';
import { ButtonWithPermissionCheck } from '@tamanu/ui-components';
import { useEncounter } from '../../../contexts/Encounter';
import { NoteTableWithPermission } from '../../../components/NoteTable';
import { NotesSearchBar } from '../../../components/SearchBar';
import { TabPane } from '../components';
import { NOTE_FORM_MODES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useNoteModal } from '../../../contexts/NoteModal';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';

export const NotesPane = React.memo(({ encounter, disabled }) => {
  // Filters are intentionally kept in local state so they reset whenever the user
  // navigates away from and back to the notes pane.
  const [searchParameters, setSearchParameters] = useState({});
  const { loadEncounter } = useEncounter();
  const { openNoteModal, updateNoteModalProps } = useNoteModal();

  const noteModalOnSaved = async createdNote => {
    updateNoteModalProps({ note: createdNote });
    loadEncounter(encounter.id);
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
      <NotesSearchBar
        searchParameters={searchParameters}
        setSearchParameters={setSearchParameters}
        extraActions={
          <NoteModalActionBlocker>
            <ButtonWithPermissionCheck
              onClick={handleOpenNewNote}
              disabled={disabled}
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
        noteModalOnSaved={noteModalOnSaved}
        data-testid="notetablewithpermission-ngp2"
      />
    </TabPane>
  );
});
