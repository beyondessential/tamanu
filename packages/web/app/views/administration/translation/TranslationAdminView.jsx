import React from 'react';
import { TranslationForm } from './TranslationForm';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { ImportExportView } from '../components/ImportExportView';
import { useTranslation } from '../../../contexts/Translation';

const TRANSLATED_STRING_REFDATA_TYPE = 'translatedString';

export const TranslationAdminView = () => {
  const { getTranslation } = useTranslation();

  const editTab = {
    label: <TranslatedText stringId="admin.translation.edit" fallback="Edit" />,
    key: 'edit',
    icon: 'fa fa-edit',
    render: TranslationForm,
  };
  return (
    <ImportExportView
      title={getTranslation('admin.translation.title', 'Translation')}
      endpoint="referenceData"
      dataTypes={[TRANSLATED_STRING_REFDATA_TYPE]}
      buildTabs={(importTab, exportTab) => [editTab, importTab, exportTab]}
      defaultTab="edit"
    />
  );
};
