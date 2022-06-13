import React from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';

import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';

export const ProgramsPane = React.memo(({ endpoint }) => {
  const dispatch = useDispatch();
  return (
    <div>
      <DataFetchingProgramsTable endpoint={endpoint} />
      <ContentPane>
        <Button onClick={() => dispatch(push('/programs'))} variant="contained" color="primary">
          New survey
        </Button>
      </ContentPane>
    </div>
  );
});
