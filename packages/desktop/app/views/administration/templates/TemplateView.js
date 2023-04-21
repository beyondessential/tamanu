import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';

import { TopBar, PageContainer, ContentPane, DataFetchingTable, DateDisplay } from '../../../components';
import { Colors } from '../../../constants';
import { NewTemplateForm } from '../../../forms';
import { useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';

import { TEMPLATE_ENDPOINT } from '../constants';
import { TemplateList } from './TemplateList';
import { EditTemplateModal } from './EditTemplateModal';

const ContentContainer = styled.div`
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  border-radius: 5px;
  margin-bottom: 20px;
`;

export const TemplateView = ({ }) => {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [existingTemplateNames, setExistingTemplateNames] = useState([]);

  const api = useApi();
  const { currentUser } = useAuth();

  const refreshTable = useCallback(() => setRefreshCount(refreshCount => refreshCount + 1), [setRefreshCount]);

  const createTemplate = useCallback(
    async (data, { resetForm }) => {
      console.log(data);
      await api.post(TEMPLATE_ENDPOINT, {
        createdBy: currentUser.id,
        ...data,
      });
      refreshTable();
      resetForm();
    },
    [api, currentUser.id, refreshTable],
  );

  // TODO: NEED to rename
  const onEditTemplate = useCallback(
    async data => {
      console.log(data);
      await api.put(TEMPLATE_ENDPOINT, {
        createdBy: currentUser.id,
        ...data,
      });
      refreshTable();
    },
    [api, currentUser.id, refreshTable],
  );

  // TODO: redundant callback
  const editTemplate = useCallback(
    template => {
      console.log(template);
      setEditingTemplate(template)
    },
    [setEditingTemplate],
  );

  const closeModal = useCallback(
    () => {
      setEditingTemplate(null)
    },
    [setEditingTemplate],
  );

  return (
    <PageContainer>
      <EditTemplateModal open={!!editingTemplate} template={editingTemplate} onSubmit={onEditTemplate} onClose={closeModal} />
      <TopBar title="Templates" />
      <ContentPane>
        <ContentContainer>
          <NewTemplateForm onSubmit={createTemplate} refreshTable={refreshTable}/>
        </ContentContainer>
        <TemplateList refreshCount={refreshCount} onRowClick={editTemplate} />
      </ContentPane>
    </PageContainer>
  );
};
