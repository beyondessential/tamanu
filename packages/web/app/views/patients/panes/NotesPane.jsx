import React, { useState } from 'react';
import styled from 'styled-components';

import { useEncounter } from '../../../contexts/Encounter';
import { NoteModal } from '../../../components/NoteModal';
import { NoteTableWithPermission } from '../../../components/NoteTable';
import {
  ButtonWithPermissionCheck,
  TableButtonRow,
  TranslatedSelectField,
} from '../../../components';
import { TabPane } from '../components';
import { NOTE_FORM_MODES } from '../../../constants';
import { useEncounterNotesQuery } from '../../../contexts/EncounterNotes';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { NOTE_TYPES, NOTE_TYPE_LABELS } from '@tamanu/constants';

const StyledTranslatedSelectField = styled(TranslatedSelectField)`
  width: 200px;
`;

export const NotesPane = React.memo(({ encounter, readonly }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { noteType, setNoteType } = useEncounterNotesQuery();
  const { loadEncounter } = useEncounter();

  const noteModalOnSaved = async () => {
    setModalOpen(false);
    await loadEncounter(encounter.id);
  };

  return (
    <TabPane>
      <NoteModal
        title={<TranslatedText
          stringId="note.modal.create.title"
          fallback="New note"
          data-testid='translatedtext-v04m' />}
        open={modalOpen}
        encounterId={encounter.id}
        onClose={() => setModalOpen(false)}
        onSaved={noteModalOnSaved}
        confirmText={<TranslatedText
          stringId="note.action.add"
          fallback="Add note"
          data-testid='translatedtext-7nw7' />}
        noteFormMode={NOTE_FORM_MODES.CREATE_NOTE}
      />
      <TableButtonRow variant="small" justifyContent="space-between">
        <StyledTranslatedSelectField
          onChange={e => setNoteType(e.target.value)}
          value={noteType}
          name="noteType"
          enumValues={NOTE_TYPE_LABELS}
          transformOptions={options => [
            {
              value: null,
              label: <TranslatedText
                stringId="general.select.all"
                fallback="All"
                data-testid='translatedtext-797v' />,
            },
            ...options.filter(
              option => ![NOTE_TYPES.CLINICAL_MOBILE, NOTE_TYPES.SYSTEM].includes(option.value),
            ),
          ]}
          isClearable={false}
        />
        <ButtonWithPermissionCheck
          onClick={() => setModalOpen(true)}
          disabled={readonly}
          verb="create"
          noun="EncounterNote"
          data-testid='buttonwithpermissioncheck-kz0x'>
          <TranslatedText
            stringId="note.action.new"
            fallback="New note"
            data-testid='translatedtext-vy2u' />
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
