import React from 'react';
import styled from 'styled-components';
import { IMAGING_TABLE_VERSIONS } from '@tamanu/constants/imaging';
import {
  ContentPane,
  ImagingRequestsSearchBar,
  PageContainer,
  SearchTableTitle,
  TopBar,
  TranslatedText,
} from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';

const BASE_ADVANCED_FIELDS = ['allFacilities', 'locationGroupId', 'departmentId'];
const ACTIVE_ADVANCED_FIELDS = [...BASE_ADVANCED_FIELDS, 'requestedById'];
const COMPLETED_ADVANCED_FIELDS = [...BASE_ADVANCED_FIELDS, 'completedAt'];

const StyledContentPane = styled(ContentPane)`
  position: relative;
`;

const ImagingRequestListing = ({ tableVersion, advancedFields }) => {
  // Since we need to track the state of the search bar and table for each version of the Imaging request table,
  // We assign a memoryKey to each version of the based on the grouping of statuses it is displaying.
  const { memoryKey, statuses } = tableVersion;
  return (
    <StyledContentPane data-testid="styledcontentpane-iuvf">
      <SearchTableTitle data-testid="searchtabletitle-pmmp">
        <TranslatedText
          stringId="imagingRequestList.search.title"
          fallback="Imaging request search"
          data-testid="translatedtext-imaging-request-search-title"
        />
      </SearchTableTitle>
      <ImagingRequestsSearchBar
        memoryKey={memoryKey}
        statuses={statuses}
        advancedFields={advancedFields}
        data-testid="imagingrequestssearchbar-x9mh"
      />
      <ImagingRequestsTable
        memoryKey={memoryKey}
        statuses={statuses}
        data-testid="imagingrequeststable-ycaa"
      />
    </StyledContentPane>
  );
};

export const ImagingRequestListingView = () => (
  <PageContainer data-testid="pagecontainer-6o1d">
    <TopBar
      title={
        <TranslatedText
          stringId="imagingRequestList.active.title"
          fallback="Active imaging requests"
          data-testid="translatedtext-imaging-request-active-title"
        />
      }
      data-testid="topbar-nf61"
    />
    {/* Here we give the listing an object containing the code for tracking the search state and also an array
    of statuses to be filtered by for each table */}
    <ImagingRequestListing
      tableVersion={IMAGING_TABLE_VERSIONS.ACTIVE}
      advancedFields={ACTIVE_ADVANCED_FIELDS}
      data-testid="imagingrequestlisting-9bgv"
    />
  </PageContainer>
);

export const CompletedImagingRequestListingView = () => (
  <PageContainer data-testid="pagecontainer-t33i">
    <TopBar
      title={
        <TranslatedText
          stringId="imagingRequestList.completed.title"
          fallback="Completed imaging requests"
          data-testid="translatedtext-imaging-request-completed-title"
        />
      }
      data-testid="topbar-wb10"
    />
    {/* This is the same situation as above. We decided to separate out the active and completed components as we were
    running into state problems when switching between contexts for the same component */}
    <ImagingRequestListing
      tableVersion={IMAGING_TABLE_VERSIONS.COMPLETED}
      advancedFields={COMPLETED_ADVANCED_FIELDS}
      data-testid="imagingrequestlisting-u7f6"
    />
  </PageContainer>
);
