import React from 'react';
import { Grid } from '@material-ui/core';
import { MedicationCollection } from '../../collections';
import { prepareMedication } from '../../actions/medication/requests';
import {
  medicationColumns, medicationStatuses,
} from '../../constants';
import {
  TextButton, TopBar, BrowsableTable,
} from '../../components';

export default function CompletedRequests() {
  return (
    <React.Fragment>
      <TopBar
        title="Completed Medication Requests"
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
          columns={medicationColumns}
          fetchOptions={{ status: medicationStatuses.FULFILLED }}
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
