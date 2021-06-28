import React from 'react';

import { TopBar, PageContainer } from '../components';
import { LabRequestsSearchBar } from '../components/LabRequestsSearchBar';
import { LabRequestsTable } from '../components/LabRequestsTable';

export const LabRequestListingView = React.memo(() => {
  const [searchParameters, setSearchParameters] = React.useState({});

  return (
    <PageContainer>
      <TopBar title="Lab requests" />
      <LabRequestsSearchBar onSearch={setSearchParameters} />
      <LabRequestsTable fetchOptions={searchParameters} />
    </PageContainer>
  );
});
