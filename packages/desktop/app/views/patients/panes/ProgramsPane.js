import React from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';

import { useParams } from 'react-router-dom';
import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';

export const ProgramsPane = React.memo(({ endpoint }) => {
  const params = useParams();
  const dispatch = useDispatch();

  const handleNewSurvey = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/programs/new`));

  return (
    <div>
      <DataFetchingProgramsTable endpoint={endpoint} />
      <ContentPane>
        <Button onClick={handleNewSurvey} variant="contained" color="primary">
          New survey
        </Button>
      </ContentPane>
    </div>
  );
});
