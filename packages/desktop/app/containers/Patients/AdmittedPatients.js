import React from 'react';
import { TopBar, DataFetchingTable, PageContainer } from '../../components';

import { displayId, location, firstName, lastName, sex, dateOfBirth } from './columns';
import { PATIENT_SEARCH_ENDPOINT } from './constants';

const COLUMNS = [displayId, location, firstName, lastName, sex, dateOfBirth];

export const AdmittedPatients = React.memo(() => (
  <PageContainer>
    <TopBar title="Admitted Patients" />
    <DataFetchingTable
      endpoint={PATIENT_SEARCH_ENDPOINT}
      columns={COLUMNS}
      fetchOptions={{ admitted: true }}
      noDataMessage="No admitted patients found"
    />
  </PageContainer>
));
