import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { TableButtonRow, NoteModalActionBlocker } from '../../../components';
import { Button, TranslatedText } from '@tamanu/ui-components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';
import { TabPane } from '../components';

export const EncounterProgramsPane = React.memo(({ patient }) => {
  const params = useParams();
  const navigate = useNavigate();

  const handleNewSurvey = () =>
    navigate(
      `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}/programs/new`,
    );

  return (
    <TabPane data-testid="tabpane-sdew">
      <TableButtonRow variant="small" data-testid="tablebuttonrow-3f11">
        <NoteModalActionBlocker>
          <Button onClick={handleNewSurvey} data-testid="button-zch8">
            <TranslatedText
              stringId="program.action.newSurvey"
              fallback="New form"
              data-testid="translatedtext-64xx"
            />
          </Button>
        </NoteModalActionBlocker>
      </TableButtonRow>
      <DataFetchingProgramsTable
        endpoint={`encounter/${params.encounterId}/programResponses`}
        patient={patient}
        data-testid="datafetchingprogramstable-7e8f"
      />
    </TabPane>
  );
});
