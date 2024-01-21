import React from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { Button, ContentPane, TableButtonRow } from '../../../components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';

export const PatientProgramsPane = React.memo(({ endpoint }) => {
  const dispatch = useDispatch();
  const params = useParams();

  const handleNewSurvey = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/programs/new`));

  return (
    <ContentPane>
      <TableButtonRow variant="small">
        <Button onClick={handleNewSurvey}>New form</Button>
      </TableButtonRow>
      <DataFetchingProgramsTable endpoint={endpoint} />
    </ContentPane>
  );
});
