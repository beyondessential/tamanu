import React from 'react';
import styled from 'styled-components';
import { ButtonWithPermissionCheck, AutocompleteInput } from '@tamanu/ui-components';
import { NOTE_TYPES } from '@tamanu/constants';
import { useEncounter } from '../../../contexts/Encounter';
import { NoteTableWithPermission } from '../../../components/NoteTable';
import { TableButtonRow } from '../../../components';
import { useSuggester } from '../../../api';
import { TabPane } from '../components';
import { NOTE_FORM_MODES } from '../../../constants';
import { useEncounterNotesQuery } from '../../../contexts/EncounterNotes';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useNoteModal } from '../../../contexts/NoteModal';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';

const StyledAutocompleteInput = styled(AutocompleteInput)`
  width: 200px;
`;

export const NotesPane = React.memo(({ encounter, readonly }) => {
  const { noteTypeId, setNoteTypeId } = useEncounterNotesQuery();
  const { loadEncounter } = useEncounter();
  const { openNoteModal, updateNoteModalProps } = useNoteModal();
  const noteTypeSuggester = useSuggester('noteType', {
    filterer: ({ id }) => id !== NOTE_TYPES.CLINICAL_MOBILE && id !== NOTE_TYPES.SYSTEM,
  });

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
      <TableButtonRow variant="small" justifyContent="space-between">
        <StyledAutocompleteInput
          onChange={e => setNoteTypeId(e.target.value)}
          value={noteTypeId}
          name="noteType"
          suggester={noteTypeSuggester}
          isClearable={false}
          data-testid="styledtranslatedselectfield-oy9y"
        />
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
      </TableButtonRow>
      <NoteTableWithPermission
        encounterId={encounter.id}
        verb="write"
        noun="EncounterNote"
        noteTypeId={noteTypeId}
        noteModalOnSaved={noteModalOnSaved}
        data-testid="notetablewithpermission-ngp2"
      />
    </TabPane>
  );
});
