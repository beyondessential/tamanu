import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ButtonWithPermissionCheck, TableButtonRow } from '../../../components';
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
    // generate an id for the procedure upfront so that one is available if a procedure survey is submitted
    // before the procedure is submitted
    setEditedProcedure({
      id: uuidv4(),
    });
  };

  return (
    <TabPane data-testid="tabpane-q1xp">
      <ProcedureModal
        editedProcedure={editedProcedure}
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
