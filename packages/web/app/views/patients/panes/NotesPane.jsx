import React from 'react';
import styled from 'styled-components';
import { TranslatedSelectField, ButtonWithPermissionCheck } from '@tamanu/ui-components';
import { useEncounter } from '../../../contexts/Encounter';
import { NoteTableWithPermission } from '../../../components/NoteTable';
import { TableButtonRow } from '../../../components';
import { TabPane } from '../components';
import { NOTE_FORM_MODES } from '../../../constants';
import { useEncounterNotesQuery } from '../../../contexts/EncounterNotes';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { NOTE_TYPES, NOTE_TYPE_LABELS } from '@tamanu/constants';
import { useNoteModal } from '../../../contexts/NoteModal';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';

const StyledTranslatedSelectField = styled(TranslatedSelectField)`
  width: 200px;
`;

export const NotesPane = React.memo(({ encounter, readonly }) => {
  const { noteType, setNoteType } = useEncounterNotesQuery();
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
      <TableButtonRow variant="small" justifyContent="space-between">
        <StyledTranslatedSelectField
          onChange={e => setNoteType(e.target.value)}
          value={noteType}
          name="noteType"
          enumValues={NOTE_TYPE_LABELS}
          transformOptions={options => [
            {
              value: null,
              label: (
                <TranslatedText
                  stringId="general.select.all"
                  fallback="All"
                  data-testid="translatedtext-awa7"
                />
              ),
            },
            ...options.filter(
              option => ![NOTE_TYPES.CLINICAL_MOBILE, NOTE_TYPES.SYSTEM].includes(option.value),
            ),
          ]}
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
        noteModalOnSaved={noteModalOnSaved}
        noteType={noteType}
        data-testid="notetablewithpermission-ngp2"
      />
    </TabPane>
  );
});
