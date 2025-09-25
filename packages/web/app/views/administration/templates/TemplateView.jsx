import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { TEMPLATE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';

import { ContentPane, PageContainer, TopBar } from '../../../components';
import { NewTemplateForm } from './NewTemplateForm';
import { useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';

import { TEMPLATE_ENDPOINT } from '../constants';
import { TemplateList } from './TemplateList';
import { EditTemplateModal } from './EditTemplateModal';
import { useRefreshCount } from '../../../hooks/useRefreshCount';

const ContentContainer = styled.div`
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.white};
  border-radius: 5px;
  margin-bottom: 20px;
`;

export const TemplateView = () => {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [refreshCount, updateRefreshCount] = useRefreshCount();

  const api = useApi();
  const { currentUser } = useAuth();

  const createTemplate = useCallback(
    async (data, { resetForm }) => {
      await api.post(TEMPLATE_ENDPOINT, {
        createdById: currentUser.id,
        ...data,
      });
      updateRefreshCount();
      resetForm();
    },
    [api, currentUser.id, updateRefreshCount],
  );

  const onEditTemplate = useCallback(
    async (data) => {
      await api.put(`${TEMPLATE_ENDPOINT}/${data.id}`, {
        createdById: currentUser.id,
        ...data,
      });
      updateRefreshCount();
      setEditingTemplate(null);
    },
    [api, currentUser.id, updateRefreshCount],
  );

  const onDeleteTemplate = useCallback(async () => {
    await api.put(`${TEMPLATE_ENDPOINT}/${editingTemplate.id}`, {
      visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
    });
    updateRefreshCount();
    setEditingTemplate(null);
  }, [api, updateRefreshCount, editingTemplate?.id]);

  return (
    <PageContainer data-testid="pagecontainer-sslq">
      <EditTemplateModal
        open={!!editingTemplate}
        template={editingTemplate}
        onSubmit={onEditTemplate}
        onClose={() => setEditingTemplate(null)}
        onDelete={onDeleteTemplate}
        allowInputTitleType={[TEMPLATE_TYPES.PATIENT_LETTER]}
        data-testid="edittemplatemodal-pqg9"
      />
      <TopBar
        title={
          <TranslatedText
            stringId="admin.template.title"
            fallback="Templates"
            data-testid="translatedtext-ymk6"
          />
        }
        data-testid="topbar-lv3u"
      />
      <ContentPane data-testid="contentpane-y13i">
        <ContentContainer data-testid="contentcontainer-clq8">
          <NewTemplateForm
            allowInputTitleType={[TEMPLATE_TYPES.PATIENT_LETTER]}
            onSubmit={createTemplate}
            refreshTable={updateRefreshCount}
            data-testid="newtemplateform-y114"
          />
        </ContentContainer>
        <TemplateList
          refreshCount={refreshCount}
          onRowClick={setEditingTemplate}
          data-testid="templatelist-77lv"
        />
      </ContentPane>
    </PageContainer>
  );
};
