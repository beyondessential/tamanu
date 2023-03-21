import React, { useState } from 'react';
import { TopBar, PageContainer, DataFetchingTable, DateDisplay } from '../../../components';
import { NewTemplateForm } from '../../../forms';
import { TemplateList } from './TemplateList';
import { useApi } from '../../../api';

export const TemplateView = ({ }) => {

  return (
    <PageContainer>
      <TopBar title="Templates" />
      <NewTemplateForm />
      <TemplateList />
      {/* {modal} */}
    </PageContainer>
  );
};
