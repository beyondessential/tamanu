import React from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { ContentPane, TableButtonRow, Button } from '../../../components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';

export const ProgramsPane = React.memo(({ endpoint }) => {
  const dispatch = useDispatch();
  return (
    <ContentPane>
      <TableButtonRow variant="small">
        <Button onClick={() => dispatch(push('/programs'))}>New survey</Button>
      </TableButtonRow>
      <DataFetchingProgramsTable endpoint={endpoint} />
    </ContentPane>
  );
});
