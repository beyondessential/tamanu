import React from 'react';
import styled from 'styled-components';
import { ContentPane, PageContainer, SearchTableTitle, TopBar, TriageSearchBar } from '../components';
import { TriageTable } from '../components/TriageTable';
import { TriageDashboard } from '../components/TriageDashboard';
import { Colors } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { PatientSearchKeys, usePatientSearch } from '../contexts/PatientSearch';
import { useAuth } from '../contexts/Auth';

const Section = styled.div`
  background: white;
  border-bottom: 1px solid ${Colors.outline};
`;

export const TriageListingView = () => {
  const { searchParameters, setSearchParameters } = usePatientSearch(
    PatientSearchKeys.TriageListingView,
  );
  const { facilityId } = useAuth();

  return (
    <PageContainer data-testid="pagecontainer-mjc9">
      <TopBar
        title={
          <TranslatedText
            stringId="patientList.triage.title"
            fallback="Emergency patients"
            data-testid="translatedtext-zm2d"
          />
        }
        data-testid="topbar-nnv9"
      />
      <Section data-testid="section-deaj">
        <ContentPane data-testid="contentpane-cymj">
          <TriageDashboard data-testid="triagedashboard-iokz" />
        </ContentPane>
      </Section>
      <ContentPane data-testid="contentpane-egho">
        <SearchTableTitle data-testid="searchtabletitle-triage">
          <TranslatedText
            stringId="patientList.search.title"
            fallback="Patient search"
            data-testid="translatedtext-triage-search-title"
          />
        </SearchTableTitle>
        <TriageSearchBar
          onSearch={setSearchParameters}
          searchParameters={searchParameters}
          data-testid="triagesearchbar"
        />
        <TriageTable
          searchParameters={{ facilityId, ...searchParameters }}
          data-testid="triagetable-xgik"
        />
      </ContentPane>
    </PageContainer>
  );
};
