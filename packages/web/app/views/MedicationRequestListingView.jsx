import React from 'react';
import styled from 'styled-components';
import {
  ContentPane,
  MedicationRequestsSearchBar,
  PageContainer,
  SearchTableTitle,
  TopBar,
  TranslatedText,
} from '../components';
import { MedicationRequestsTable } from '../components/MedicationRequestsTable';

const StyledContentPane = styled(ContentPane)`
  position: relative;
`;

export const MedicationRequestListingView = () => (
  <PageContainer data-testid="pagecontainer-medication-request-listing">
    <TopBar
      title={
        <TranslatedText
          stringId="medication-requests.list.title"
          fallback="Active medication requests"
          data-testid="translatedtext-medication-request-active-title"
        />
      }
      data-testid="topbar-medication-request-active-title"
    />
    <StyledContentPane data-testid="styledcontentpane-medication">
      <SearchTableTitle data-testid="searchtabletitle-medication">
        <TranslatedText
          stringId="medication-requests.search.title"
          fallback="Active request search"
          data-testid="translatedtext-medication-request-search-title"
        />
      </SearchTableTitle>
      <MedicationRequestsSearchBar />
      <MedicationRequestsTable />
    </StyledContentPane>
  </PageContainer>
);
