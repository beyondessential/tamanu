import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import { TopBar, PageContainer, ContentPane, DataFetchingTable, DateDisplay } from '../../../components';
import { Colors } from '../../../constants';
import { NewTemplateForm } from '../../../forms';
import { useApi } from '../../../api';

import { TEMPLATE_ENDPOINT } from '../constants';
import { TemplateList } from './TemplateList';

const ContentContainer = styled.div`
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  border-radius: 5px;
  margin-bottom: 20px;
`;

export const TemplateView = ({ }) => {
  const api = useApi();

  const createTemplate = useCallback(
    async (data) => {
      console.log(data);
      await api.post(TEMPLATE_ENDPOINT, data);
    },
    [api],
  );

  return (
    <PageContainer>
      <TopBar title="Templates" />
      <ContentPane>
        <ContentContainer>
          <NewTemplateForm onSubmit={createTemplate} />
        </ContentContainer>
        <TemplateList />
      </ContentPane>
      {/* {modal} */}
    </PageContainer>
  );
};
