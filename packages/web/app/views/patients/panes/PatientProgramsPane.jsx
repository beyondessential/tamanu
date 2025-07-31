import React from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { Button, ContentPane, NoteModalActionBlocker, TableButtonRow } from '../../../components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { PatientSurveyAssignmentsTable } from '../../../components/PatientSurveyAssignmentsTable';

export const PatientProgramsPane = React.memo(({ endpoint, patient }) => {
  const dispatch = useDispatch();
  const params = useParams();

  const handleNewSurvey = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/programs/new`));

  return (
    <ContentPane data-testid="contentpane-8dfj">
      <TableButtonRow variant="small" data-testid="tablebuttonrow-iyka">
        <NoteModalActionBlocker>
          <Button onClick={handleNewSurvey} data-testid="button-i54d">
            <TranslatedText
              stringId="program.action.newSurvey"
              fallback="New form"
              data-testid="translatedtext-865f"
            />
          </Button>
        </NoteModalActionBlocker>
      </TableButtonRow>
      <DataFetchingProgramsTable
        endpoint={endpoint}
        patient={patient}
        data-testid="datafetchingprogramstable-uytn"
      />
      <PatientSurveyAssignmentsTable patient={patient} />
    </ContentPane>
  );
});
