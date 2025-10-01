import React from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { push } from 'redux-first-history';
import { Button, TableButtonRow, NoteModalActionBlocker } from '../../../components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';
import { TabPane } from '../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const EncounterProgramsPane = React.memo(({ patient }) => {
  const dispatch = useDispatch();
  const params = useParams();

  const handleNewSurvey = () =>
    dispatch(
      push(
        `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}/programs/new`,
      ),
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
