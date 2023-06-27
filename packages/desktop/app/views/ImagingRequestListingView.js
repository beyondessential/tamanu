import React from 'react';
import { IMAGING_TABLE_VERSIONS } from '@tamanu/shared/constants/imaging';
import {
  TopBar,
  PageContainer,
  ImagingRequestsSearchBar,
  ContentPane,
  SearchTableTitle,
} from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';

const ImagingRequestListing = ({ tableVersion }) => {
  // Since we need to track the state of the search bar and table for each version of the Imaging request table,
  // We assign a memoryKey to each version of the based on the grouping of statuses it is displaying.
  const { memoryKey, statuses } = tableVersion;
  return (
    <ContentPane>
      <SearchTableTitle>Imaging request search</SearchTableTitle>
      <ImagingRequestsSearchBar memoryKey={memoryKey} statuses={statuses} />
      <ImagingRequestsTable memoryKey={memoryKey} statuses={statuses} />
    </ContentPane>
  );
};

export const ImagingRequestListingView = () => (
  <PageContainer>
    <TopBar title="Imaging requests" />
    {/* Here we give the listing an object containing the code for tracking the search state and also an array
    of statuses to be filtered by for each table */}
    <ImagingRequestListing tableVersion={IMAGING_TABLE_VERSIONS.ACTIVE} />
  </PageContainer>
);

export const CompletedImagingRequestListingView = () => (
  <PageContainer>
    <TopBar title="Completed imaging requests" />
    {/* This is the same situation as above. We decided to seperate out the active and completed components as we were
    running into state problems when switching between contexts for the same component */}
    <ImagingRequestListing tableVersion={IMAGING_TABLE_VERSIONS.COMPLETED} />
  </PageContainer>
);
