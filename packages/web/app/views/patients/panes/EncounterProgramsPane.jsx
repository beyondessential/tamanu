import React from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { TableButtonRow, Button } from '../../../components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';
import { TabPane } from '../components';

export const EncounterProgramsPane = React.memo(() => {
  const dispatch = useDispatch();
  const params = useParams();

  const handleNewSurvey = () =>
    dispatch(
      push(
        `/patients/${params.category}/${params.patientId}/encounter/${params.encounterId}/programs/new`,
      ),
    );

  return (
    <TabPane>
      <TableButtonRow variant="small">
        <Button onClick={handleNewSurvey}>New form</Button>
      </TableButtonRow>
      <DataFetchingProgramsTable endpoint={`encounter/${params.encounterId}/programResponses`} />
    </TabPane>
  );
});
