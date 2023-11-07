import React from 'react';
import styled from 'styled-components';
import { PageContainer, TopBar, ContentPane } from '../../components';
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
  <PageContainer>
    <TopBar
      title={<TranslatedText stringId="reportGenerator.title" fallback="Report generator" />}
    />
    <ContentPane>
      <ContentContainer>
        <ReportGeneratorForm />
      </ContentContainer>
    </ContentPane>
  </PageContainer>
);
