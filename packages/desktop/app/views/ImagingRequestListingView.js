import React from 'react';
import {
  TopBar,
  PageContainer,
  ImagingRequestsSearchBar,
  ContentPane,
  SearchTableTitle,
} from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';

export const ImagingRequestListingView = () => (
  <PageContainer>
    <TopBar title="Imaging requests" />
    <ContentPane>
      <SearchTableTitle>Imaging request search</SearchTableTitle>
      <ImagingRequestsSearchBar />
      <ImagingRequestsTable />
    </ContentPane>
  </PageContainer>
);
