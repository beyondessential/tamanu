import React, { useState } from 'react';
import { ButtonWithPermissionCheck } from '@tamanu/ui-components';
import { TableButtonRow } from '../../../components';
import { ProcedureModal } from '../../../components/ProcedureModal';
import { ProcedureTable } from '../../../components/ProcedureTable';
import { useEncounter } from '../../../contexts/Encounter';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';

export const ProcedurePane = React.memo(({ encounter, readonly }) => {
  const [editedProcedure, setEditedProcedure] = useState(null);
  const { loadEncounter } = useEncounter();

  const onCreateNewProcedure = () => {
    setEditedProcedure({});
  };

  return (
    <TabPane data-testid="tabpane-q1xp">
      <ProcedureModal
        key={editedProcedure} /* Ensures that the modal is reset on close */
        editedProcedure={editedProcedure}
        setEditedProcedure={setEditedProcedure}
        encounterId={encounter.id}
        onClose={() => setEditedProcedure(null)}
        onSaved={async () => {
          setEditedProcedure(null);
          await loadEncounter(encounter.id);
        }}
        data-testid="proceduremodal-xq2p"
      />
      <TableButtonRow variant="small" data-testid="tablebuttonrow-o76z">
        <NoteModalActionBlocker>
          <ButtonWithPermissionCheck
            onClick={onCreateNewProcedure}
            disabled={readonly}
            verb="create"
            noun="Procedure"
            data-testid="buttonwithpermissioncheck-h58o"
          >
            <TranslatedText
              stringId="procedure.action.create"
              fallback="New procedure"
              data-testid="translatedtext-gqco"
            />
          </ButtonWithPermissionCheck>
        </NoteModalActionBlocker>
      </TableButtonRow>
      <ProcedureTable
        encounterId={encounter.id}
        onItemClick={item => setEditedProcedure(item)}
        data-testid="proceduretable-4661"
      />
    </TabPane>
  );
});
