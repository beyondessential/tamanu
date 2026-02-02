import React from 'react';
import styled from 'styled-components';
import {
  ContentPane,
  MedicationDispensesSearchBar,
  PageContainer,
  SearchTableTitle,
  TopBar,
  TranslatedText,
} from '../components';
import { MedicationDispensesTable } from '../components/MedicationDispensesTable';

const StyledContentPane = styled(ContentPane)`
  position: relative;
`;

export const MedicationDispenseListingView = () => (
  <PageContainer data-testid="pagecontainer-medication-dispense-listing">
    <TopBar
      title={
        <TranslatedText
          stringId="medication-dispenses.list.title"
          fallback="Dispensed medications"
          data-testid="translatedtext-medication-dispense-title"
        />
      }
      data-testid="topbar-medication-dispense-title"
    />
    <StyledContentPane data-testid="styledcontentpane-medication">
      <SearchTableTitle data-testid="searchtabletitle-medication-dispense">
        <TranslatedText
          stringId="medication-dispenses.search.title"
          fallback="Dispensed medications search"
          data-testid="translatedtext-medication-dispense-title"
        />
      </SearchTableTitle>
      <MedicationDispensesSearchBar />
      <MedicationDispensesTable />
    </StyledContentPane>
  </PageContainer>
);
