import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

import { VISIBILITY_STATUSES } from '@tamanu/shared/constants';

import { TopBar, PageContainer, ContentPane } from '../../../components';
import { Colors } from '../../../constants';
import { NewTemplateForm } from './NewTemplateForm';
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

export const TemplateView = () => {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const api = useApi();
  const { currentUser } = useAuth();

  const refreshTable = useCallback(() => setRefreshCount(count => count + 1), [setRefreshCount]);

  const createTemplate = useCallback(
    async (data, { resetForm }) => {
      await api.post(TEMPLATE_ENDPOINT, {
        createdById: currentUser.id,
        ...data,
      });
      refreshTable();
      resetForm();
    },
    [api, currentUser.id, refreshTable],
  );

  const onEditTemplate = useCallback(
    async data => {
      await api.put(`${TEMPLATE_ENDPOINT}/${data.id}`, {
        createdById: currentUser.id,
        ...data,
      });
      refreshTable();
      setEditingTemplate(null);
    },
    [api, currentUser.id, refreshTable],
  );

  const onDeleteTemplate = useCallback(async () => {
    await api.put(`${TEMPLATE_ENDPOINT}/${editingTemplate.id}`, {
      visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
    });
    refreshTable();
    setEditingTemplate(null);
  }, [api, refreshTable, editingTemplate?.id]);

  return (
    <PageContainer>
      <EditTemplateModal
        open={!!editingTemplate}
        template={editingTemplate}
        onSubmit={onEditTemplate}
        onClose={() => setEditingTemplate(null)}
        onDelete={onDeleteTemplate}
      />
      <TopBar title="Templates" />
      <ContentPane>
        <ContentContainer>
          <NewTemplateForm onSubmit={createTemplate} refreshTable={refreshTable} />
        </ContentContainer>
        <TemplateList refreshCount={refreshCount} onRowClick={setEditingTemplate} />
      </ContentPane>
    </PageContainer>
  );
};
