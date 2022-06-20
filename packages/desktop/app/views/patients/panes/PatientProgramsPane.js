import React from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { ContentPane, TableButtonRow, Button } from '../../../components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';

export const PatientProgramsPane = React.memo(({ endpoint }) => {
  const dispatch = useDispatch();
  return (
    <ContentPane>
      <TableButtonRow variant="small">
        <Button onClick={() => dispatch(push('/programs'))} variant="contained" color="primary">
          New survey
        </Button>
      </TableButtonRow>
      <DataFetchingProgramsTable endpoint={endpoint} />
    </ContentPane>
  );
});
