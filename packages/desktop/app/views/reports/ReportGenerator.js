import React from 'react';
import styled from 'styled-components';
import { PageContainer, TopBar, ContentPane } from '../../components';
import { Colors } from '../../constants';
import { ReportGeneratorForm } from './ReportGeneratorForm';
import { ReportRequestTable } from './ReportRequestTable';

const ContentContainer = styled.div`
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
`;

const Spacer = styled.div`
  padding-top: 30px;
`;

export const ReportGenerator = () => (
  <PageContainer>
    <TopBar title="Report generator" />
    <ContentPane>
      <ContentContainer>
        <ReportGeneratorForm />
      </ContentContainer>
      <Spacer />
      <ReportRequestTable />
    </ContentPane>
  </PageContainer>
);
