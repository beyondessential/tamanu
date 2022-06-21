import React from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { TableButtonRow, Button } from '../../../components';
import { DataFetchingProgramsTable } from '../../../components/ProgramResponsesTable';
import { TabPane } from '../components';

export const EncounterProgramsPane = React.memo(({ endpoint }) => {
  const dispatch = useDispatch();
  return (
    <TabPane>
      <TableButtonRow variant="small">
        <Button onClick={() => dispatch(push('/programs'))}>New survey</Button>
      </TableButtonRow>
      <DataFetchingProgramsTable endpoint={endpoint} />
    </TabPane>
  );
});
