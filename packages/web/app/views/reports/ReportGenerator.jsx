import React from 'react';
import styled from 'styled-components';
import { ContentPane, PageContainer, TopBar } from '../../components';
import { Colors } from '../../constants';
import { ReportGeneratorForm } from './ReportGeneratorForm';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const ContentContainer = styled.div`
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  border-radius: 5px;
`;

export const ReportGenerator = () => (
  <PageContainer data-testid="pagecontainer-keoo">
    <TopBar
      title={
        <TranslatedText
          stringId="report.generate.title"
          fallback="Report generator"
          data-testid="translatedtext-e09x"
        />
      }
      data-testid="topbar-gwfj"
    />
    <ContentPane data-testid="contentpane-6qc7">
      <ContentContainer data-testid="contentcontainer-3wed">
        <ReportGeneratorForm data-testid="reportgeneratorform-w6qz" />
      </ContentContainer>
    </ContentPane>
  </PageContainer>
);
