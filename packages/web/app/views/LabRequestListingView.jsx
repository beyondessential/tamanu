import React from 'react';
import styled from 'styled-components';
import {
  LAB_REQUEST_TABLE_STATUS_GROUPINGS,
  TABLE_PAGE_SIZE_PREFERENCE_KEYS,
} from '@tamanu/constants';
import {
  ContentPane,
  LabRequestsSearchBar,
  PageContainer,
  SearchTableTitle,
  TopBar,
  TranslatedText,
} from '../components';
import { LabRequestsTable } from './LabRequestsTable';
import { LabRequestSearchParamKeys, useLabRequest } from '../contexts/LabRequest';

const StyledContentPane = styled(ContentPane)`
  position: relative;
`;

const LabRequestListing = ({
  statuses,
  searchParamKey = LabRequestSearchParamKeys.All,
  pageSizePreferenceKey,
}) => {
  const { searchParameters } = useLabRequest(searchParamKey);

  return (
    <StyledContentPane data-testid="styledcontentpane-l071">
      <SearchTableTitle data-testid="searchtabletitle-f5fy">
        <TranslatedText
          stringId="lab.list.search.title"
          fallback="Lab request search"
          data-testid="translatedtext-lab-request-search-title"
        />
      </SearchTableTitle>
      <LabRequestsSearchBar statuses={statuses} data-testid="labrequestssearchbar-xktv" />
      <LabRequestsTable
        searchParameters={searchParameters}
        statuses={statuses}
        pageSizePreferenceKey={pageSizePreferenceKey}
        data-testid="labrequeststable-s0ka"
      />
    </StyledContentPane>
  );
};

export const LabRequestListingView = () => (
  <PageContainer data-testid="pagecontainer-qljt">
    <TopBar
      title={
        <TranslatedText
          stringId="lab.list.active.title"
          fallback="Active lab requests"
          data-testid="translatedtext-lab-request-active-title"
        />
      }
      data-testid="topbar-576y"
    />
    <LabRequestListing
      statuses={LAB_REQUEST_TABLE_STATUS_GROUPINGS.ACTIVE}
      pageSizePreferenceKey={TABLE_PAGE_SIZE_PREFERENCE_KEYS.ACTIVE_LAB_REQUESTS}
      data-testid="labrequestlisting-bxu7"
    />
  </PageContainer>
);

export const FinalisedLabRequestListingView = () => (
  <PageContainer data-testid="pagecontainer-u7ab">
    <TopBar
      title={
        <TranslatedText
          stringId="lab.list.finalised.title"
          fallback="Finalised requests"
          data-testid="translatedtext-lab-request-finalised-title"
        />
      }
      data-testid="topbar-gc5j"
    />
    <LabRequestListing
      statuses={LAB_REQUEST_TABLE_STATUS_GROUPINGS.COMPLETED}
      searchParamKey={LabRequestSearchParamKeys.Finalised}
      pageSizePreferenceKey={TABLE_PAGE_SIZE_PREFERENCE_KEYS.FINALISED_LAB_REQUESTS}
      data-testid="labrequestlisting-3j4y"
    />
  </PageContainer>
);
