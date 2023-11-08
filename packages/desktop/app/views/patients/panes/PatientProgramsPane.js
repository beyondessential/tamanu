import React from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { ContentPane, TableButtonRow, Button } from '../../../components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const PatientProgramsPane = React.memo(({ endpoint }) => {
  const dispatch = useDispatch();
  const params = useParams();

  const handleNewSurvey = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/programs/new`));

  return (
    <ContentPane>
      <TableButtonRow variant="small">
        <Button onClick={handleNewSurvey}>
          <TranslatedText stringId="program.action.newSurvey" fallback="New survey" />
        </Button>
      </TableButtonRow>
      <DataFetchingProgramsTable endpoint={endpoint} />
    </ContentPane>
  );
});
