import React from 'react';
import { ContentPane, TopBar } from '../../../components';
import { TranslationForm } from './TranslationForm';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const TranslationAdminView = () => {
  return (
    <div>
      <TopBar
        title={<TranslatedText stringId="admin.translation.title" fallback="Translation" />}
      />
      <ContentPane>
        <TranslationForm />
      </ContentPane>
    </div>
  );
};
