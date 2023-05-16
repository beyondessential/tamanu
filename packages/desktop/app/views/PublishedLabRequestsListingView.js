import React from 'react';
import { LAB_REQUEST_STATUSES } from 'shared/constants';
import {
  TopBar,
  PageContainer,
  LabRequestsSearchBar,
  ContentPane,
  SearchTableTitle,
} from '../components';
import { LabRequestsTable } from './LabRequestsTable';

export const PublishedLabRequestsListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Published lab requests" />
    <ContentPane>
      <SearchTableTitle>Lab request search</SearchTableTitle>
      <LabRequestsSearchBar status={LAB_REQUEST_STATUSES.PUBLISHED} />
      <LabRequestsTable status={LAB_REQUEST_STATUSES.PUBLISHED} />
    </ContentPane>
  </PageContainer>
));
