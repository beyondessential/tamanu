import React from 'react';
import styled from 'styled-components';
import { TopBar, PageContainer, ContentPane } from '../components';
import { TriageTable } from '../components/TriageTable';
import { TriageDashboard } from '../components/TriageDashboard';
import { Colors } from '../constants';

const Section = styled.div`
  background: white;
  border-bottom: 1px solid ${Colors.outline};
`;

export const TriageListingView = () => (
  <PageContainer>
    <TopBar title="Emergency patients" />
    <Section>
      <ContentPane>
        <TriageDashboard />
      </ContentPane>
    </Section>
    <ContentPane>
      <TriageTable />
    </ContentPane>
  </PageContainer>
);
