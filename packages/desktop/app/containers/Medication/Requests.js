import React from 'react';
import { Grid } from '@material-ui/core';
import { MedicationCollection } from '../../collections';
import { prepareMedication } from '../../actions/medication/requests';
import {
  medicationColumns, medicationStatuses, headerStyle, columnStyle,
} from '../../constants';
import {
  TextButton, Button, TopBar, BrowsableTable,
} from '../../components';

const ActionsColumn = () => (
  <Button
    variant="contained"
    color="primary"
  >
    Fulfill
  </Button>
);

const getTableColumns = () => ([
  ...medicationColumns,
  {
    id: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 200,
    Cell: <ActionsColumn />,
    filterable: false,
  },
]);

export default function Requests() {
  return (
    <React.Fragment>
      <TopBar
        title="Medication Requests"
        buttons={[{
          to: '/medication/request',
          text: 'New Request',
          can: { do: 'create', on: 'medication' },
        }, {
          variant: 'contained',
          color: 'secondary',
          to: '/medication/dispense',
          text: 'Dispense Medication',
          can: { do: 'create', on: 'medication' },
        }]}
      />
      <Grid container item>
        <BrowsableTable
          collection={new MedicationCollection()}
          columns={getTableColumns()}
          fetchOptions={{ status: medicationStatuses.REQUESTED }}
          transformRow={prepareMedication}
          emptyNotification={(
            <React.Fragment>
              No medications found.
              <TextButton
                style={{ marginLeft: 8 }}
                to="/medication/request"
                can={{ do: 'create', on: 'medication' }}
              >
                Create a new medication record?
              </TextButton>
            </React.Fragment>
          )}
        />
      </Grid>
    </React.Fragment>
  );
}
