import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import { TopBar, PageContainer, ContentPane, DataFetchingTable, DateDisplay } from '../../../components';
import { Colors } from '../../../constants';
import { NewTemplateForm } from '../../../forms';
import { useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';

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
  const [refreshCount, setRefreshCount] = useState(0);
  const api = useApi();
  const { currentUser } = useAuth();

  const createTemplate = useCallback(
    async (data) => {
      console.log(data);
      await api.post(TEMPLATE_ENDPOINT, {
        createdBy: currentUser.id,
        ...data,
      });
      setRefreshCount(refreshCount => refreshCount + 1)
    },
    [api, currentUser.id, setRefreshCount],
  );

  return (
    <PageContainer>
      <TopBar title="Templates" />
      <ContentPane>
        <ContentContainer>
          <NewTemplateForm onSubmit={createTemplate} />
        </ContentContainer>
        <TemplateList refreshCount={refreshCount} />
      </ContentPane>
      {/* {modal} */}
    </PageContainer>
  );
};
