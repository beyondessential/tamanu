import React from 'react';
import styled from 'styled-components';
import { TopBar, PageContainer, ContentPane } from '../components';
import { TriageStatisticsCard } from '../components/TriageStatisticsCard';
import { TriageTable } from '../components/TriageTable';

const StatisticsRow = styled.div`
  display: flex;
  margin: 16px 0 30px 0;
  filter: drop-shadow(2px 2px 25px rgba(0, 0, 0, 0.1));
`;

export const TriageListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Emergency department" />
    <ContentPane>
      <StatisticsRow>
        <TriageStatisticsCard priorityLevel={1} />
        <TriageStatisticsCard priorityLevel={2} />
        <TriageStatisticsCard priorityLevel={3} />
      </StatisticsRow>
      <TriageTable />
    </ContentPane>
  </PageContainer>
));
