import React from 'react';
import { ContentPane, PageContainer, TopBar } from '../../../components';
import { TranslationForm } from './TranslationForm';

export const TranslationAdminView = () => {
  return (
    <PageContainer>
      <TopBar title="Translation" />
      <ContentPane>
        <TranslationForm />
      </ContentPane>
    </PageContainer>
  );
};
