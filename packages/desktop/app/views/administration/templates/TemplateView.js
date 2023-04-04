import React, { useState } from 'react';
import styled from 'styled-components';
import { TopBar, PageContainer, ContentPane, DataFetchingTable, DateDisplay } from '../../../components';
import { Colors } from '../../../constants';
import { NewTemplateForm } from '../../../forms';
import { TemplateList } from './TemplateList';
import { useApi } from '../../../api';

const ContentContainer = styled.div`
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  border-radius: 5px;
  margin-bottom: 20px;
`;

export const TemplateView = ({ }) => {

  return (
    <PageContainer>
      <TopBar title="Templates" />
      <ContentPane>
        <ContentContainer>
          <NewTemplateForm />
        </ContentContainer>
        <TemplateList />
      </ContentPane>
      {/* {modal} */}
    </PageContainer>
  );
};
