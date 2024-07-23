import React from 'react';
import { ContentPane, PageContainer, TopBar } from '../../../components';
import { TranslationForm } from './TranslationForm';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const TranslationAdminView = () => {
  return (
    <PageContainer>
      <TopBar
        title={<TranslatedText stringId="admin.translation.title" fallback="Translation" />}
      />
      <ContentPane>
        <TranslationForm />
      </ContentPane>
    </PageContainer>
  );
};
