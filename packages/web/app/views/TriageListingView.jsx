import React from 'react';
import styled from 'styled-components';
import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
import { ContentPane, PageContainer, TopBar } from '../components';
import { TriageTable } from '../components/TriageTable';
import { TriageDashboard } from '../components/TriageDashboard';

const Section = styled.div`
  background: white;
  border-bottom: 1px solid ${TAMANU_COLORS.outline};
`;

export const TriageListingView = () => (
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
      <TriageTable data-testid="triagetable-xgik" />
    </ContentPane>
  </PageContainer>
);
