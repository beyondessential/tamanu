import React, { useState, useEffect, useCallback } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getDate = ({ date }) => (date ? <DateDisplay date={date} /> : '');
const getDisplayName = ({ owner }) => (owner || {}).displayName || '';

const COLUMNS = [
  { key: 'name', title: 'Name' },
  { key: 'type', title: 'Type' },
  { key: 'createdDate', title: 'Creation', accessor: getDate },
  { key: 'uploadedDate', title: 'Upload', accessor: getDate },
  { key: 'owner', title: 'Owner', accessor: getDisplayName },
  { key: 'comments', title: 'Comments', accessor: '' },
  { key: 'actions', title: 'Actions', accessor: '' },
];

export const PatientDocumentsTable = React.memo(({ patientId, searchParameters }) => {
  return (
    <DataFetchingTable
      endpoint={`patient/${patientId}/documentMetadata`}
      columns={COLUMNS}
      noDataMessage="No documents found"
      fetchOptions={searchParameters}
    />
  );
});
